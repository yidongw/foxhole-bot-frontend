export const BaseTemplate = (props: {
  children: React.ReactNode;
}) => {
  return (
    <div className="w-full antialiased">
      <div className="mx-auto min-w-[320px]">
        <main>{props.children}</main>
      </div>
    </div>
  );
};
