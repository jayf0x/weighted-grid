import { cases } from "./cases";

const Wrapper = ({ children }) => (
  <section className="mx-auto size-[900px]">{children}</section>
);

export const App = () => (
  <div className="flex flex-col gap-16 p-10">
    {cases.map((Item, i) => (
      <Wrapper>
        <h1 id="case-index">Case: {i}</h1>
        <Item key={i} />
      </Wrapper>
    ))}
  </div>
);
