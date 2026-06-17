import type {
  Booking,
  Room,
  ApprovalRouteRule,
  RuleCondition,
  ApprovalFlow,
  ApprovalStep,
  ApprovalStatus
} from '@/types';

const evaluateCondition = (
  condition: RuleCondition,
  booking: Booking,
  room: Room
): boolean => {
  const { type, operator, value } = condition;

  let actualValue: string | number | string[];

  switch (type) {
    case 'room_level':
      actualValue = room.level;
      break;
    case 'duration':
      actualValue = booking.duration;
      break;
    case 'attendee_count':
      actualValue = booking.attendeeCount;
      break;
    case 'booking_type':
      actualValue = booking.type;
      break;
    default:
      return false;
  }

  switch (operator) {
    case 'eq':
      return actualValue === value;
    case 'ne':
      return actualValue !== value;
    case 'gt':
      return Number(actualValue) > Number(value);
    case 'gte':
      return Number(actualValue) >= Number(value);
    case 'lt':
      return Number(actualValue) < Number(value);
    case 'lte':
      return Number(actualValue) <= Number(value);
    case 'in':
      if (Array.isArray(value)) {
        return value.includes(String(actualValue));
      }
      return String(actualValue) === String(value);
    case 'not_in':
      if (Array.isArray(value)) {
        return !value.includes(String(actualValue));
      }
      return String(actualValue) !== String(value);
    default:
      return false;
  }
};

export const evaluateRule = (
  rule: ApprovalRouteRule,
  booking: Booking,
  room: Room
): boolean => {
  if (!rule.isEnabled) return false;

  const results = rule.conditions.map(condition =>
    evaluateCondition(condition, booking, room)
  );

  if (rule.conditionLogic === 'AND') {
    return results.every(r => r);
  } else {
    return results.some(r => r);
  }
};

export const findMatchingRule = (
  rules: ApprovalRouteRule[],
  booking: Booking,
  room: Room
): ApprovalRouteRule | null => {
  const enabledRules = rules
    .filter(r => r.isEnabled)
    .sort((a, b) => a.priority - b.priority);

  for (const rule of enabledRules) {
    if (evaluateRule(rule, booking, room)) {
      console.log('[ApprovalUtils] 匹配到审批规则:', rule.name, '优先级:', rule.priority);
      return rule;
    }
  }

  console.log('[ApprovalUtils] 未匹配到任何审批规则，使用默认流程');
  return null;
};

export const createApprovalSteps = (flow: ApprovalFlow): ApprovalStep[] => {
  return flow.steps.map(step => ({
    ...step,
    id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending' as ApprovalStatus
  }));
};

export const getApprovalProgress = (steps: ApprovalStep[]): { completed: number; total: number; percentage: number } => {
  const total = steps.length;
  const completed = steps.filter(s => s.status === 'approved' || s.status === 'rejected').length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percentage };
};

export const getCurrentStep = (steps: ApprovalStep[]): ApprovalStep | null => {
  return steps.find(s => s.status === 'pending') || null;
};

export const canApprove = (steps: ApprovalStep[], approverId: string): boolean => {
  const currentStep = getCurrentStep(steps);
  if (!currentStep) return false;
  return currentStep.approverId === approverId;
};

export const isApprovalComplete = (steps: ApprovalStep[]): boolean => {
  return steps.every(s => s.status !== 'pending');
};

export const getApprovalResult = (steps: ApprovalStep[]): 'approved' | 'rejected' | 'pending' => {
  if (steps.some(s => s.status === 'rejected')) {
    return 'rejected';
  }
  if (steps.every(s => s.status === 'approved')) {
    return 'approved';
  }
  return 'pending';
};

export const generateDefaultFlow = (level: number): ApprovalFlow => {
  const steps: ApprovalStep[] = [
    {
      id: 'step_1',
      stepNumber: 1,
      approverRole: '部门主管',
      status: 'pending'
    }
  ];

  if (level >= 2) {
    steps.push({
      id: 'step_2',
      stepNumber: 2,
      approverRole: '行政经理',
      status: 'pending'
    });
  }

  if (level >= 3) {
    steps.push({
      id: 'step_3',
      stepNumber: 3,
      approverRole: '分管领导',
      status: 'pending'
    });
  }

  return {
    id: `flow_default_${level}`,
    name: `默认审批流程-${level}级`,
    steps,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const validateRule = (rule: ApprovalRouteRule): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!rule.name?.trim()) {
    errors.push('规则名称不能为空');
  }

  if (!rule.conditions || rule.conditions.length === 0) {
    errors.push('至少需要一个条件');
  }

  if (!rule.flowId) {
    errors.push('请选择审批流程');
  }

  rule.conditions.forEach((condition, index) => {
    if (!condition.type) {
      errors.push(`第${index + 1}个条件缺少类型`);
    }
    if (!condition.operator) {
      errors.push(`第${index + 1}个条件缺少操作符`);
    }
    if (condition.value === undefined || condition.value === null || condition.value === '') {
      errors.push(`第${index + 1}个条件缺少值`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

export const getConditionDisplayText = (condition: RuleCondition): string => {
  const typeLabels: Record<string, string> = {
    room_level: '会议室级别',
    duration: '会议时长',
    attendee_count: '参会人数',
    booking_type: '预约类型'
  };

  const operatorLabels: Record<string, string> = {
    eq: '等于',
    ne: '不等于',
    gt: '大于',
    gte: '大于等于',
    lt: '小于',
    lte: '小于等于',
    in: '包含',
    not_in: '不包含'
  };

  const type = typeLabels[condition.type] || condition.type;
  const operator = operatorLabels[condition.operator] || condition.operator;

  let valueText: string;
  if (Array.isArray(condition.value)) {
    valueText = condition.value.join(', ');
  } else if (condition.type === 'room_level') {
    const levelLabels: Record<string, string> = {
      vip: 'VIP',
      standard: '标准',
      basic: '基础'
    };
    valueText = levelLabels[String(condition.value)] || String(condition.value);
  } else if (condition.type === 'booking_type') {
    const typeLabels: Record<string, string> = {
      single: '单次',
      recurrence: '周期'
    };
    valueText = typeLabels[String(condition.value)] || String(condition.value);
  } else if (condition.type === 'duration') {
    valueText = `${condition.value}分钟`;
  } else {
    valueText = String(condition.value);
  }

  return `${type} ${operator} ${valueText}`;
};
