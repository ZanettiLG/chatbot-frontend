const Conditional = ({ condition, children }: { condition: boolean, children: React.ReactNode }) => {
  return condition ? children : null;
};

export default Conditional;