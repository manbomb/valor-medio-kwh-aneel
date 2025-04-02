import { CalcResponse, ValorMedioKwhAneelCalculo } from "./index";
import { EModalidadeTarifaria, ESubClasse, ESubGrupoTarifario } from "./types";

describe("Dias faturados", () => {
    const calculator = new ValorMedioKwhAneelCalculo();
    const inicio = new Date("2024-06-12");
    const fim = new Date("2024-07-12");

    let resultado: CalcResponse;

    beforeAll(async () => {
        console.time('teste');
        resultado = await calculator.calc({
            dataInicio: inicio,
            dataFim: fim,
            cnpjDistribuidora: "04368898000106",
            subGrupoTarifario: ESubGrupoTarifario.B1,
            modalidadeTarifaria: EModalidadeTarifaria.Convencional,
            subClasse: ESubClasse.Residencial,
            ICMS: 19 / 100,
            COFINS: 4.6140 / 100,
            PIS: 0.9980 / 100,
        });
        console.timeEnd('teste');
        console.log("resultado >", resultado);
        // grupo tarifario B1 precisa especificar sub classe
        // grupo tarifario B3 nao precisa especificar sub classe
    });

    it("deve retornar 30 dias, entre 2024-06-12 até 2024-07-12", async () => {
        expect(resultado.diasFaturados).toBe(30);
    });
});
