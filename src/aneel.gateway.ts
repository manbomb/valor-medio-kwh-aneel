import axios from "axios";
import { EModalidadeTarifaria, ESubClasse, ESubGrupoTarifario } from "./types";
import { isBefore } from "date-fns";

export type BandeiraTarifariaAcionada = {
    _id: number;
    DatGeracaoConjuntoDados: string;
    DatCompetencia: string;
    NomBandeiraAcionada: string;
    VlrAdicionalBandeira: string;
};

export type TarifaDeAplicacao = {
    _id: number;
    DatGeracaoConjuntoDados: string;
    DscREH: string;
    SigAgente: string;
    NumCNPJDistribuidora: string;
    DatInicioVigencia: string;
    DatFimVigencia: string;
    DscBaseTarifaria: string;
    DscSubGrupo: string;
    DscModalidadeTarifaria: string;
    DscClasse: string;
    DscSubClasse: string;
    DscDetalhe: string;
    NomPostoTarifario: string;
    DscUnidadeTerciaria: string;
    SigAgenteAcessante: string;
    VlrTUSD: string;
    VlrTE: string;
};

type ApiResponse<T> = {
    help: string;
    success: boolean;
    result: {
        include_total: boolean;
        limit: number;
        records_format: string;
        resource_id: string;
        total_estimation_threshold: null | number;
        records: T[];
        fields: { id: string; type: string }[];
        _links: { start: string; next: string };
        total: number;
        total_was_estimated: boolean;
    };
};

export class AneelGateway {
    private readonly apiUrl: string =
        "https://dadosabertos.aneel.gov.br/api/3/action/datastore_search";

    async listarBandeirasTarifariasAcionamentos(): Promise<
        BandeiraTarifariaAcionada[]
    > {
        const resourceId = "0591b8f6-fe54-437b-b72b-1aa2efd46e42";
        const records: BandeiraTarifariaAcionada[] = [];
        let offset = 0;
        const limit = 100;

        while (true) {
            try {
                const response = await axios.get<
                    ApiResponse<BandeiraTarifariaAcionada>
                >(this.apiUrl, {
                    params: {
                        resource_id: resourceId,
                        limit,
                        offset,
                    },
                });

                const data = response.data;
                records.push(...data.result.records);

                if (data.result.records.length < limit) {
                    break;
                }

                offset += limit;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    throw new Error(
                        `Erro ao acessar a API: ${
                            error.response?.statusText || error.message
                        }`
                    );
                }
                throw error;
            }
        }

        const sortedRecords = records.sort(
            (a, b) => isBefore(new Date(a.DatCompetencia), new Date(b.DatCompetencia)) ? -1 : 1
        );

        return sortedRecords;
    }

    async listarTarifasDeAplicacao(
        cnpjDistribuidora: string,
        subGrupoTarifario: ESubGrupoTarifario | string,
        modalidadeTarifaria: EModalidadeTarifaria | string,
        subClasse?: ESubClasse | string,
        sigAgente?: string
    ): Promise<TarifaDeAplicacao[]> {
        const resourceId = "fcf2906c-7c32-4b9b-a637-054e7a5234f4";
        const records: TarifaDeAplicacao[] = [];
        let offset = 0;
        const limit = 100;

        while (true) {
            try {
                const query = `SELECT * FROM "${resourceId}" WHERE "DscSubGrupo" = '${subGrupoTarifario}' AND "DscModalidadeTarifaria" = '${modalidadeTarifaria}' ${
                    subClasse ? `AND "DscSubClasse" = '${subClasse}'` : ""
                } AND "DscBaseTarifaria" = 'Tarifa de Aplicação' AND "DscDetalhe" = 'Não se aplica' 
                AND ${
                    sigAgente
                        ? `"SigAgente" = '${sigAgente}'`
                        : `"NumCNPJDistribuidora" = '${cnpjDistribuidora}'`
                } LIMIT ${limit} OFFSET ${offset}`;

                const response = await axios.get<
                    ApiResponse<TarifaDeAplicacao>
                >(this.apiUrl + "_sql", {
                    params: {
                        sql: query,
                    },
                });

                const data = response.data;
                records.push(...data.result.records);

                if (data.result.records.length < limit) {
                    break;
                }

                offset += limit;
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    throw new Error(
                        `Erro ao acessar a API: ${
                            error.response?.statusText || error.message
                        }`
                    );
                }
                throw error;
            }
        }

        const sortedRecords = records.sort((a, b) => a._id - b._id);

        return sortedRecords;
    }
}
