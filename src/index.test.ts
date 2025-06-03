import { ValorMedioKwhAneelCalculo } from "./index";
import { EModalidadeTarifaria, ESubClasse, ESubGrupoTarifario } from "./types";

describe("Dias faturados", () => {
    const calculator = new ValorMedioKwhAneelCalculo();

    beforeEach(async () => {
        console.time("teste");
    });

    it("deve retornar 30 dias, entre 2024-06-12 até 2024-07-12", async () => {
        const inicio = new Date("2024-06-12");
        const fim = new Date("2024-07-12");

        const resultado = await calculator.calc({
            dataInicio: inicio,
            dataFim: fim,
            cnpjDistribuidora: "04368898000106",
            subGrupoTarifario: ESubGrupoTarifario.B1,
            modalidadeTarifaria: EModalidadeTarifaria.Convencional,
            subClasse: ESubClasse.Residencial,
            ICMS: 19 / 100,
            COFINS: 4.614 / 100,
            PIS: 0.998 / 100,
        });
        // grupo tarifario B1 precisa especificar sub classe
        // grupo tarifario B3 nao precisa especificar sub classe
        console.log("resultado >", resultado);

        expect(resultado.diasFaturados).toBe(30);
    });

    it("deve retornar bandeira verde para o periodo", async () => {
        const inicio = new Date("2025-03-08");
        const fim = new Date("2025-04-07");

        const resultado = await calculator.calc({
            dataInicio: inicio,
            dataFim: fim,
            cnpjDistribuidora: "04368898000106",
            subGrupoTarifario: ESubGrupoTarifario.B1,
            modalidadeTarifaria: EModalidadeTarifaria.Convencional,
            subClasse: ESubClasse.Residencial,
            ICMS: 19 / 100,
            COFINS: 4.614 / 100,
            PIS: 0.998 / 100,
        });

        console.log("resultado >", resultado);

        expect(resultado.diasFaturados).toBe(30);
        expect(resultado.bandeirasIncidentes[0]).toBeDefined();
        expect(resultado.bandeirasIncidentes[0]!.bandeira).toBe("Verde");
        expect(resultado.bandeirasIncidentes[1]).toBeDefined();
        expect(resultado.bandeirasIncidentes[1]!.bandeira).toBe("Verde");
    });

    it("deve retornar 30 dias, entre 2024-06-12 até 2024-07-12, com razao social", async () => {
        const inicio = new Date("2024-06-12");
        const fim = new Date("2024-07-12");

        const resultado = await calculator.calc({
            dataInicio: inicio,
            dataFim: fim,
            cnpjDistribuidora: "04368898000106",
            sigAgente: "Neoenergia PE",
            subGrupoTarifario: ESubGrupoTarifario.B1,
            modalidadeTarifaria: EModalidadeTarifaria.Convencional,
            subClasse: ESubClasse.Residencial,
            ICMS: 19 / 100,
            COFINS: 4.614 / 100,
            PIS: 0.998 / 100,
        });
        // grupo tarifario B1 precisa especificar sub classe
        // grupo tarifario B3 nao precisa especificar sub classe
        console.log("resultado >", resultado);

        expect(resultado.diasFaturados).toBe(30);
    });

    it("deve retornar bandeira verde para o periodo, com razao social", async () => {
        const inicio = new Date("2025-03-08");
        const fim = new Date("2025-04-07");

        const resultado = await calculator.calc({
            dataInicio: inicio,
            dataFim: fim,
            cnpjDistribuidora: "04368898000106",
            sigAgente: "Neoenergia PE",
            subGrupoTarifario: ESubGrupoTarifario.B1,
            modalidadeTarifaria: EModalidadeTarifaria.Convencional,
            subClasse: ESubClasse.Residencial,
            ICMS: 19 / 100,
            COFINS: 4.614 / 100,
            PIS: 0.998 / 100,
        });

        console.log("resultado >", resultado);

        expect(resultado.diasFaturados).toBe(30);
        expect(resultado.bandeirasIncidentes[0]).toBeDefined();
        expect(resultado.bandeirasIncidentes[0]!.bandeira).toBe("Verde");
        expect(resultado.bandeirasIncidentes[1]).toBeDefined();
        expect(resultado.bandeirasIncidentes[1]!.bandeira).toBe("Verde");
    });

    afterEach(() => {
        console.timeEnd("teste");
    });
});
