import {
    addDays,
    addMinutes,
    differenceInCalendarDays,
    isBefore,
    max,
    min,
    parseISO,
    startOfMonth,
    subDays,
} from "date-fns";
import { AneelGateway, BandeiraTarifariaAcionada } from "./aneel.gateway";
import { EModalidadeTarifaria, ESubClasse, ESubGrupoTarifario } from "./types";
import { adicionarImpostos, arred, parseValor } from "./utils";

export { EModalidadeTarifaria, ESubClasse, ESubGrupoTarifario } from "./types";

export type CalcParams = {
    dataInicio: Date;
    dataFim: Date;
    cnpjDistribuidora: string;
    subGrupoTarifario: ESubGrupoTarifario | string;
    modalidadeTarifaria: EModalidadeTarifaria | string;
    subClasse?: ESubClasse | string;
    ICMS?: number;
    COFINS?: number;
    PIS?: number;
};

export type CalcResponse = {
    TUSD: number;
    TE: number;
    TUSDComImpostos: number;
    TEComImpostos: number;
    diasFaturados: number;
    bandeirasIncidentes: {
        dias: number;
        bandeira: string;
        adicional: number;
    }[];
    adicionalDeBandeiraMedio: number;
    adicionalDeBandeiraMedioComImpostos: number;
};

export interface IValorMedioKwhAneelCalculo {
    calc(params: CalcParams): Promise<CalcResponse>;
}

export class ValorMedioKwhAneelCalculo implements IValorMedioKwhAneelCalculo {
    constructor(private readonly aneelGateway = new AneelGateway()) {}

    private calcDiasFaturados(inicio: Date, fim: Date): number {
        const diasFaturados = differenceInCalendarDays(fim, inicio);

        if (diasFaturados < 1) {
            throw new Error("Número de dias faturados menor do que 1.");
        }

        return diasFaturados;
    }

    private async getBandeirasIncidentes(
        inicio: Date,
        fim: Date
    ): Promise<
        {
            dias: number;
            bandeira: string;
            adicional: number;
        }[]
    > {
        const competencia = (dia: Date) => {
            const offset = new Date().getTimezoneOffset();
            return startOfMonth(addMinutes(dia, offset))
                .toISOString()
                .split("T")[0];
        };

        const diasPorCompetencia = new Map<string, number>();

        let diaAtual = addDays(inicio, 1);
        while (diaAtual < addDays(fim, 1)) {
            const chaveCompetencia = competencia(diaAtual);
            const dias = (diasPorCompetencia.get(chaveCompetencia) || 0) + 1;
            diasPorCompetencia.set(chaveCompetencia, dias);
            diaAtual = addDays(diaAtual, 1);
        }

        const acionamentosDeBandeira =
            await this.aneelGateway.listarBandeirasTarifariasAcionamentos();

        const acionamentoPorCompetencia = (competencia: string) => {
            const dataCompetencia = new Date(competencia);
            const primeiroAcionamento = acionamentosDeBandeira[0];
            const dataPrimeiroAcionamento = new Date(
                primeiroAcionamento.DatCompetencia
            );

            if (dataCompetencia < dataPrimeiroAcionamento) {
                throw new Error(
                    "Data de competencia anterior ao primeiro registro que possuímos"
                );
            }

            let vigente: BandeiraTarifariaAcionada | undefined = undefined;

            for (let i = acionamentosDeBandeira.length - 1; i >= 0; i--) {
                const acionamento = acionamentosDeBandeira[i];
                const dataAcionamento = new Date(acionamento.DatCompetencia);

                if (dataCompetencia >= dataAcionamento) {
                    vigente = acionamento;
                    break;
                }
            }

            if (!vigente) {
                throw new Error(
                    "Não foi encontrado um acionamento vigente para a competência fornecida."
                );
            }

            return vigente;
        };

        const diasEBandeiraPorCompetencia = new Map(
            Array.from(diasPorCompetencia).map(([competencia, dias]) => {
                const acionamento = acionamentoPorCompetencia(competencia);
                const bandeira = acionamento.NomBandeiraAcionada;
                const adicional = parseValor(acionamento.VlrAdicionalBandeira);
                return [competencia, { dias, bandeira, adicional }];
            })
        );

        const bandeirasIncidentes = Array.from(
            diasEBandeiraPorCompetencia.values()
        );

        return bandeirasIncidentes;
    }

    private calcAdicionalDeBandeiraMedio(
        bandeirasIncidentes: {
            dias: number;
            bandeira: string;
            adicional: number;
        }[],
        diasFaturados: number
    ): number {
        const adicionalDeBandeiraMedio = bandeirasIncidentes
            .map((bandeira) => {
                const d = (bandeira.dias / diasFaturados) * bandeira.adicional;
                return d;
            })
            .reduce((ac, val) => ac + val, 0);
        return adicionalDeBandeiraMedio;
    }

    private async calcTETUSD(
        dataInicio: Date,
        dataFim: Date,
        cnpjDistribuidora: string,
        subGrupoTarifario: ESubGrupoTarifario | string,
        modalidadeTarifaria: EModalidadeTarifaria | string,
        subClasse?: ESubClasse | string
    ): Promise<{ TUSD: number; TE: number }> {
        const tarifasDeAplicacao =
            await this.aneelGateway.listarTarifasDeAplicacao(
                cnpjDistribuidora,
                subGrupoTarifario,
                modalidadeTarifaria,
                subClasse
            );
        const converterValor = (valor: string): number =>
            parseFloat(valor.replace(",", "."));

        let totalDias = 0;
        let somaPonderadaTUSD = 0;
        let somaPonderadaTE = 0;

        tarifasDeAplicacao.forEach((tarifa, index, array) => {
            const inicioElemento = subDays(
                parseISO(tarifa.DatInicioVigencia),
                2
            );
            const fimElemento = subDays(parseISO(tarifa.DatFimVigencia), 1);

            const inicioIntervalo = max([inicioElemento, dataInicio]);
            const fimIntervalo = min([fimElemento, dataFim]);

            if (!isBefore(fimIntervalo, inicioIntervalo)) {
                const diasIncidentes = differenceInCalendarDays(
                    fimIntervalo,
                    inicioIntervalo
                );

                const valorTUSD = converterValor(tarifa.VlrTUSD);
                const valorTE = converterValor(tarifa.VlrTE);

                totalDias += diasIncidentes;
                somaPonderadaTUSD += valorTUSD * diasIncidentes;
                somaPonderadaTE += valorTE * diasIncidentes;
            }
        });

        const TUSD = totalDias > 0 ? somaPonderadaTUSD / totalDias : 0;
        const TE = totalDias > 0 ? somaPonderadaTE / totalDias : 0;

        return { TUSD, TE };
    }

    async calc({
        dataFim,
        dataInicio,
        cnpjDistribuidora,
        modalidadeTarifaria,
        subClasse,
        subGrupoTarifario,
        COFINS = 0,
        ICMS = 0,
        PIS = 0,
    }: CalcParams): Promise<CalcResponse> {
        const diasFaturados = this.calcDiasFaturados(dataInicio, dataFim);

        const [bandeirasIncidentes, { TE, TUSD }] = await Promise.all([
            this.getBandeirasIncidentes(dataInicio, dataFim),
            this.calcTETUSD(
                dataInicio,
                dataFim,
                cnpjDistribuidora,
                subGrupoTarifario,
                modalidadeTarifaria,
                subClasse
            ),
        ]);

        const adicionalDeBandeiraMedio = this.calcAdicionalDeBandeiraMedio(
            bandeirasIncidentes,
            diasFaturados
        );

        const [
            adicionalDeBandeiraMedioComImpostos,
            TEComImpostos,
            TUSDComImpostos,
        ] = [
            adicionarImpostos(adicionalDeBandeiraMedio, ICMS, PIS, COFINS),
            adicionarImpostos(TE, ICMS, PIS, COFINS),
            adicionarImpostos(TUSD, ICMS, PIS, COFINS),
        ];

        return {
            TE: arred(TE, 3),
            TUSD: arred(TUSD, 3),
            TEComImpostos: arred(TEComImpostos, 3),
            TUSDComImpostos: arred(TUSDComImpostos, 3),
            diasFaturados,
            bandeirasIncidentes,
            adicionalDeBandeiraMedio: arred(adicionalDeBandeiraMedio, 6),
            adicionalDeBandeiraMedioComImpostos: arred(
                adicionalDeBandeiraMedioComImpostos,
                6
            ),
        };
    }
}
