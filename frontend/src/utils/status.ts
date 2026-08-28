export const getStatusColor = (status: string): { text: string; bar: string; dot: string } => {
  switch (status) {
    case 'COMPLETED':
      return { text: 'text-emerald-400', bar: 'bg-emerald-400', dot: 'bg-emerald-500' };
    case 'TESTING':
      return { text: 'text-amber-400', bar: 'bg-amber-400', dot: 'bg-amber-500' };
    case 'SIMULATED':
      return { text: 'text-orange-400', bar: 'bg-orange-400', dot: 'bg-orange-500' };
    case 'NOT STARTED':
      return { text: 'text-gray-400', bar: 'bg-gray-400', dot: 'bg-gray-500' };
    default:
      return { text: 'text-cyan-400', bar: 'bg-cyan-400', dot: 'bg-cyan-500' };
  }
};
