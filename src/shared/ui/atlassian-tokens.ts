export const atlassianColors = {
  primary: '#0052CC',
  primaryHover: '#0065FF',
  primaryActive: '#0747A6',

  neutralDark: '#172B4D',
  neutralMedium: '#6B778C',
  neutralLight: '#EBECF0',
  neutralSubtle: '#F4F5F7',
  neutralHover: '#091E4214',

  success: '#00875A',
  successSubtle: '#E3FCEF',
  successText: '#006644',

  warning: '#FFAB00',
  warningSubtle: '#FFFAE6',
  warningText: '#172B4D',

  danger: '#DE350B',
  dangerSubtle: '#FFEBE6',
  dangerText: '#BF2600',

  purple: '#6554C0',
  purpleSubtle: '#EAE6FF',

  teal: '#00B8D9',
  tealSubtle: '#E6FCFF',
} as const;

export const labelColors: Record<string, { bg: string; text: string }> = {
  green: { bg: '#61BD4F', text: '#FFFFFF' },
  yellow: { bg: '#F2D600', text: '#172B4D' },
  orange: { bg: '#FF9F1A', text: '#FFFFFF' },
  red: { bg: '#EB5A46', text: '#FFFFFF' },
  purple: { bg: '#C377E0', text: '#FFFFFF' },
  blue: { bg: '#0079BF', text: '#FFFFFF' },
};
