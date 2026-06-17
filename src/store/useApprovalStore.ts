import { create } from 'zustand';
import type {
  ApprovalRouteRule,
  ApprovalRecord,
  ApprovalFlow,
  ApprovalActionData,
  RuleCondition,
  Booking,
  Room
} from '@/types';
import { mockApprovalRules, mockApprovalRecords, mockApprovalFlows } from '@/data/approvals';
import { findMatchingRule, createApprovalSteps, getApprovalResult } from '@/utils/approvalUtils';
import { storage, STORAGE_KEYS } from '@/utils/storage';

interface ApprovalState {
  rules: ApprovalRouteRule[];
  records: ApprovalRecord[];
  flows: ApprovalFlow[];
  selectedRecord: ApprovalRecord | null;
  selectedRule: ApprovalRouteRule | null;
  loading: boolean;
  error: string | null;
  filterStatus: 'pending' | 'approved' | 'rejected' | 'all';
  currentUserId: string;
}

interface ApprovalActions {
  fetchApprovals: () => Promise<void>;
  saveApprovals: () => Promise<void>;
  setSelectedRecord: (record: ApprovalRecord | null) => void;
  setSelectedRule: (rule: ApprovalRouteRule | null) => void;
  setFilterStatus: (status: 'pending' | 'approved' | 'rejected' | 'all') => void;
  getRecordById: (id: string) => ApprovalRecord | undefined;
  getRuleById: (id: string) => ApprovalRouteRule | undefined;
  getFlowById: (id: string) => ApprovalFlow | undefined;
  getMyPendingApprovals: (userId: string) => ApprovalRecord[];
  getMyApprovedApprovals: (userId: string) => ApprovalRecord[];
  createApprovalRecord: (booking: Booking, room: Room) => ApprovalRecord | null;
  processApproval: (recordId: string, action: 'approve' | 'reject', comment?: string) => void;
  createRule: (rule: Omit<ApprovalRouteRule, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRule: (id: string, updates: Partial<ApprovalRouteRule>) => void;
  deleteRule: (id: string) => void;
  toggleRuleEnabled: (id: string) => void;
  addCondition: (ruleId: string, condition: Omit<RuleCondition, 'id'>) => void;
  removeCondition: (ruleId: string, conditionId: string) => void;
  getFilteredRecords: () => ApprovalRecord[];
}

export const useApprovalStore = create<ApprovalState & ApprovalActions>((set, get) => ({
  rules: [],
  records: [],
  flows: [],
  selectedRecord: null,
  selectedRule: null,
  loading: false,
  error: null,
  filterStatus: 'all',
  currentUserId: 'user_001',

  saveApprovals: async () => {
    await Promise.all([
      storage.set(STORAGE_KEYS.APPROVAL_RECORDS, get().records),
      storage.set(STORAGE_KEYS.APPROVAL_RULES, get().rules),
      storage.set(STORAGE_KEYS.APPROVAL_FLOWS, get().flows)
    ]);
  },

  fetchApprovals: async () => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 200));

      const [savedRecords, savedRules, savedFlows] = await Promise.all([
        storage.get<ApprovalRecord[]>(STORAGE_KEYS.APPROVAL_RECORDS),
        storage.get<ApprovalRouteRule[]>(STORAGE_KEYS.APPROVAL_RULES),
        storage.get<ApprovalFlow[]>(STORAGE_KEYS.APPROVAL_FLOWS)
      ]);

      const records = savedRecords && savedRecords.length > 0 ? savedRecords : mockApprovalRecords;
      const rules = savedRules && savedRules.length > 0 ? savedRules : mockApprovalRules;
      const flows = savedFlows && savedFlows.length > 0 ? savedFlows : mockApprovalFlows;

      set({ records, rules, flows, loading: false });

      if (!savedRecords || savedRecords.length === 0) {
        await get().saveApprovals();
      }

      console.log('[ApprovalStore] 加载成功：', records.length, '条记录,', rules.length, '条规则,', flows.length, '个流程');
    } catch (error) {
      console.error('[ApprovalStore] 加载失败:', error);
      set({
        records: mockApprovalRecords,
        rules: mockApprovalRules,
        flows: mockApprovalFlows,
        loading: false
      });
    }
  },

  setSelectedRecord: (record) => set({ selectedRecord: record }),
  setSelectedRule: (rule) => set({ selectedRule: rule }),
  setFilterStatus: (status) => set({ filterStatus: status }),

  getRecordById: (id) => get().records.find(r => r.id === id),
  getRuleById: (id) => get().rules.find(r => r.id === id),
  getFlowById: (id) => get().flows.find(f => f.id === id),

  getMyPendingApprovals: (userId) => {
    return get().records.filter(r => {
      if (r.status !== 'pending') return false;
      const currentStep = r.steps.find(s => s.status === 'pending');
      return currentStep?.approverId === userId;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getMyApprovedApprovals: (userId) => {
    return get().records.filter(r => {
      return r.steps.some(s => s.approverId === userId && s.status !== 'pending');
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  createApprovalRecord: (booking, room) => {
    const rule = findMatchingRule(get().rules, booking, room);
    const flow = rule ? get().getFlowById(rule.flowId) : null;

    if (!flow) {
      console.log('[ApprovalStore] 未找到审批流程，使用默认流程');
      return null;
    }

    const steps = createApprovalSteps(flow);
    const firstPendingStep = steps.find(s => s.status === 'pending');

    const newRecord: ApprovalRecord = {
      id: `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      bookingId: booking.id,
      ruleId: rule?.id || '',
      rule,
      flowId: flow.id,
      flow,
      currentStep: firstPendingStep ? steps.indexOf(firstPendingStep) : 0,
      steps,
      status: 'pending',
      applicant: booking.applicant || {
        id: booking.organizerId,
        name: booking.organizerName,
        department: booking.organizerDept
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    set(state => ({ records: [...state.records, newRecord] }));
    get().saveApprovals();
    console.log('[ApprovalStore] 创建审批记录:', newRecord.id, '流程:', flow.name);
    return newRecord;
  },

  processApproval: (recordId, action, comment = '') => {
    const record = get().getRecordById(recordId);
    if (!record) {
      console.error('[ApprovalStore] 未找到审批记录:', recordId);
      return;
    }

    const currentUserId = get().currentUserId;
    const currentStepIndex = record.steps.findIndex(s =>
      s.status === 'pending' && s.approverId === currentUserId
    );

    if (currentStepIndex === -1) {
      console.error('[ApprovalStore] 当前用户没有待处理的审批步骤');
      return;
    }

    const newSteps = record.steps.map((step, idx) => {
      if (idx !== currentStepIndex) return step;
      return {
        ...step,
        status: action === 'approve' ? 'approved' as const : 'rejected' as const,
        approverId: currentUserId,
        approverName: currentUserId === 'user_001' ? '张经理' : '审批人',
        comment,
        approvedAt: new Date().toISOString()
      };
    });

    const result = getApprovalResult(newSteps);
    const nextPendingStep = newSteps.findIndex(s => s.status === 'pending');
    const newStatus = result === 'pending' ? 'pending' as const :
                     result === 'approved' ? 'approved' as const : 'rejected' as const;

    set(state => ({
      records: state.records.map(r =>
        r.id === recordId
          ? {
              ...r,
              steps: newSteps,
              currentStep: nextPendingStep >= 0 ? nextPendingStep : newSteps.length,
              status: newStatus,
              updatedAt: new Date().toISOString()
            }
          : r
      )
    }));

    const { useBookingStore } = require('@/store/useBookingStore');
    const bookingStore = useBookingStore.getState();

    if (newStatus === 'approved') {
      bookingStore.updateBookingStatus(record.bookingId, 'approved');
    } else if (newStatus === 'rejected') {
      bookingStore.updateBookingStatus(record.bookingId, 'rejected');
    }

    get().saveApprovals();
    console.log('[ApprovalStore] 处理审批:', recordId, '动作:', action, '新状态:', newStatus);
  },

  createRule: (rule) => {
    const newRule: ApprovalRouteRule = {
      ...rule,
      id: `rule_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    set(state => ({ rules: [...state.rules, newRule] }));
    get().saveApprovals();
    console.log('[ApprovalStore] 创建审批规则:', newRule.name);
  },

  updateRule: (id, updates) => {
    set(state => ({
      rules: state.rules.map(r =>
        r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
      )
    }));
    get().saveApprovals();
    console.log('[ApprovalStore] 更新审批规则:', id);
  },

  deleteRule: (id) => {
    set(state => ({
      rules: state.rules.filter(r => r.id !== id)
    }));
    get().saveApprovals();
    console.log('[ApprovalStore] 删除审批规则:', id);
  },

  toggleRuleEnabled: (id) => {
    set(state => ({
      rules: state.rules.map(r =>
        r.id === id ? { ...r, isEnabled: !r.isEnabled, updatedAt: new Date().toISOString() } : r
      )
    }));
    get().saveApprovals();
    console.log('[ApprovalStore] 切换规则启用状态:', id);
  },

  addCondition: (ruleId, condition) => {
    const newCondition: RuleCondition = {
      ...condition,
      id: `condition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    set(state => ({
      rules: state.rules.map(r =>
        r.id === ruleId
          ? { ...r, conditions: [...r.conditions, newCondition], updatedAt: new Date().toISOString() }
          : r
      )
    }));
    get().saveApprovals();
  },

  removeCondition: (ruleId, conditionId) => {
    set(state => ({
      rules: state.rules.map(r =>
        r.id === ruleId
          ? { ...r, conditions: r.conditions.filter(c => c.id !== conditionId), updatedAt: new Date().toISOString() }
          : r
      )
    }));
    get().saveApprovals();
  },

  getFilteredRecords: () => {
    let records = [...get().records];

    if (get().filterStatus !== 'all') {
      records = records.filter(r => r.status === get().filterStatus);
    }

    return records.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}));
