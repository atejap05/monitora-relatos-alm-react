import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CampoTester } from "./CampoTester";

describe("CampoTester", () => {
  it("liga o input ao datalist com as sugestões e aceita nome novo", async () => {
    const onChange = vi.fn();
    render(<CampoTester value="" onChange={onChange} sugestoes={["Ana Lima", "Maria Souza"]} />);
    const campo = screen.getByLabelText("Tester responsável");
    const lista = screen.getByTestId("sugestoes-tester");
    expect(campo).toHaveAttribute("list", lista.id);
    expect([...lista.querySelectorAll("option")].map((o) => o.value)).toEqual(["Ana Lima", "Maria Souza"]);

    await userEvent.type(campo, "Z");
    expect(onChange).toHaveBeenLastCalledWith("Z");
  });

  it("mostra o contador pelo texto normalizado, ou o erro", () => {
    const { rerender } = render(<CampoTester value="  Ana   Lima " onChange={vi.fn()} sugestoes={[]} dica="Opcional." />);
    expect(screen.getByText("Opcional. 8/120 caracteres")).toBeInTheDocument();
    rerender(<CampoTester value="x" onChange={vi.fn()} sugestoes={[]} erro="Máximo de 120 caracteres." />);
    expect(screen.getByText("Máximo de 120 caracteres.")).toBeInTheDocument();
  });
});
