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
  setSelectedRecord: (record: ApprovalRecord | null) => void;
  setSelectedRule: (rule: ApprovalRouteRule | null) => void;
  setFilterStatus: (status: 'pending' | 'approved' | 'rejected' | 'all') => void;
  getRecordById: (id: string) => ApprovalRecord | undefined;
  getRuleById: (id: string) => ApprovalRouteRule | undefined;
  getFlowById: (id: string) => ApprovalFlow | undefined;
  getMyPendingApprovals: (userId: string) => ApprovalRecord[];
  getMyApprovedApprovals: (userId: string) => ApprovalRecord[];
  createApprovalRecord: (booking: Booking, room: Room) => ApprovalRecord | null;
  processApproval: (data: ApprovalActionData, approverId: string, approverName: string) => void;
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

  fetchApprovals: async () => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      set({
        rules: mockApprovalRules,
        records: mockApprovalRecords,
        flows: mockApprovalFlows,
        loading: false
      });
      console.log('[ApprovalStore] 加载审批数据成功');
    } catch (error) {
      console.error('[ApprovalStore] 加载审批数据失败:', error);
      set({ error: '加载失败', loading: false });
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

    const newRecord: ApprovalRecord = {
      id: `approval_${Date.now()}`,
      bookingId: booking.id,
      ruleId: rule?.id || '',
      rule,
      flowId: flow.id,
      flow,
      currentStep: 0,
      steps,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    set(state => ({ records: [...state.records, newRecord] }));
    console.log('[ApprovalStore] 创建审批记录:', newRecord.id, '流程:', flow.name);
    return newRecord;
  },

  processApproval: (data, approverId, approverName) => {
    set(state => ({
      records: state.records.map(record => {
        if (record.id !== data.recordId) return record;

        const newSteps = record.steps.map(step => {
          if (step.id !== data.stepId) return step;

          return {
            ...step,
            status: data.action === 'approve' ? 'approved' as const :
                    data.action === 'reject' ? 'rejected' as const : 'transferred' as const,
            approverId,
            approverName,
            comment: data.comment,
            approvedAt: new Date().toISOString()
          };
        });

        const result = getApprovalResult(newSteps);
        const currentStepIndex = newSteps.findIndex(s => s.status === 'pending');

        return {
          ...record,
          steps: newSteps,
          currentStep: currentStepIndex >= 0 ? currentStepIndex : newSteps.length,
          status: result === 'pending' ? 'pending' as const :
                  result === 'approved' ? 'approved' as const : 'rejected' as const,
          updatedAt: new Date().toISOString()
        };
      })
    }));

    console.log('[ApprovalStore] 处理审批:', data.recordId, '动作:', data.action);
  },

  createRule: (rule) => {
    const newRule: ApprovalRouteRule = {
      ...rule,
      id: `rule_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    set(state => ({ rules: [...state.rules, newRule] }));
    console.log('[ApprovalStore] 创建审批规则:', newRule.name);
  },

  updateRule: (id, updates) => {
    set(state => ({
      rules: state.rules.map(r =>
        r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
      )
    }));
    console.log('[ApprovalStore] 更新审批规则:', id);
  },

  deleteRule: (id) => {
    set(state => ({
      rules: state.rules.filter(r => r.id !== id)
    }));
    console.log('[ApprovalStore] 删除审批规则:', id);
  },

  toggleRuleEnabled: (id) => {
    set(state => ({
      rules: state.rules.map(r =>
        r.id === id ? { ...r, isEnabled: !r.isEnabled, updatedAt: new Date().toISOString() } : r
      )
    }));
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
  },

  removeCondition: (ruleId, conditionId) => {
    set(state => ({
      rules: state.rules.map(r =>
        r.id === ruleId
          ? { ...r, conditions: r.conditions.filter(c => c.id !== conditionId), updatedAt: new Date().toISOString() }
          : r
      )
    }));
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
