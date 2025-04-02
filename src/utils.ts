export const parseValor = (valor: string) =>
    parseFloat(valor.replace(".", "").replace(",", "."));

export const arred = (valor: number, d = 2): number => {
    const f = Math.pow(10, d);
    return Math.round(valor * f) / f;
};

export const adicionarImpostos = (
    valorSemImpostos: number,
    ICMS: number,
    PIS: number,
    COFINS: number
): number => {
    const valorComImpostos =
        valorSemImpostos * (1 / (1 - COFINS - PIS)) * (1 / (1 - ICMS));
    return valorComImpostos;
};
