# valor-medio-kwh-aneel

**valor-medio-kwh-aneel** é uma biblioteca em TypeScript que permite calcular os valores médios de tarifas de energia elétrica no Brasil, com base em dados abertos disponibilizados pela ANEEL (Agência Nacional de Energia Elétrica). A biblioteca calcula as tarifas de uso do sistema elétrico (TUSD) e de consumo de energia (TE), além de valores relacionados às bandeiras tarifárias.

## **Instalação**

Você pode instalar a biblioteca via npm ou yarn:

```bash
npm install valor-medio-kwh-aneel
```

ou 

```bash
yarn add valor-medio-kwh-aneel
```

## **Funcionalidades**

- Cálculo de valores de TUSD e TE, com e sem impostos.
- Identificação de bandeiras tarifárias incidentes no período informado.
- Cálculo de adicionais médios das bandeiras tarifárias, considerando os impostos (ICMS, PIS, COFINS).
- Baseado em dados atualizados fornecidos pela ANEEL.

## **Como usar**

Abaixo está um exemplo básico de uso:

```typescript
import { 
    ValorMedioKwhAneelCalculo, 
    ESubGrupoTarifario, 
    EModalidadeTarifaria, 
    ESubClasse 
} from "valor-medio-kwh-aneel";

(async () => {
    const calculo = new ValorMedioKwhAneelCalculo();

    const inicio = new Date("2024-06-12");
    const fim = new Date("2024-07-12");

    const resultado = await calculo.calc({
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

    console.log(resultado);
    // {
    //     TE: 294.572,
    //     TUSD: 335.622,
    //     TEComImpostos: 385.291,
    //     TUSDComImpostos: 438.983,
    //     diasFaturados: 30,
    //     bandeirasIncidentes: [
    //         { dias: 18, bandeira: 'Verde', adicional: 0 },
    //         { dias: 12, bandeira: 'Amarela', adicional: 18.85 }
    //     ],
    //     adicionalDeBandeiraMedio: 7.54,
    //     adicionalDeBandeiraMedioComImpostos: 9.862103
    // }
})();
```

### **Parâmetros aceitos**

- **dataInicio** *(Date)*: Data da primeira leitura do medidor.
- **dataFim** *(Date)*: Data da leitura atual do medidor.
- **cnpjDistribuidora** *(string)*: CNPJ da distribuidora de energia elétrica registrada na ANEEL.
- **sigAgente** *(string)*: Razão social da distribuidora de energia elétrica registrada na ANEEL.
- **subGrupoTarifario** *(types.ESubGrupoTarifario)*: Subgrupo tarifário, como *B1* (Residencial).
- **modalidadeTarifaria** *(types.EModalidadeTarifaria)*: Modalidade tarifária, como *Convencional* ou *Branca*.
- **subClasse** *(types.ESubClasse)*: Subclasse do consumidor, como *Residencial* ou *Rural*.
- **ICMS** *(number)*: Percentual de ICMS aplicado.
- **COFINS** *(number)*: Percentual de COFINS aplicado.
- **PIS** *(number)*: Percentual de PIS aplicado.
- **timeoutInMilliseconds** *(number)*: Valor em milissegundos máximo para requisição da Aneel responder.

### **Exemplo de Resultado**

O retorno do cálculo inclui:

- **TE**: Tarifa de energia elétrica sem impostos.
- **TUSD**: Tarifa de uso do sistema elétrico sem impostos.
- **TEComImpostos**: Tarifa de energia elétrica com impostos.
- **TUSDComImpostos**: Tarifa de uso do sistema elétrico com impostos.
- **diasFaturados**: Número de dias do período calculado.
- **bandeirasIncidentes**: Bandeiras tarifárias aplicadas no período e seus respectivos adicionais.
- **adicionalDeBandeiraMedio**: Valor médio do adicional de bandeira sem impostos.
- **adicionalDeBandeiraMedioComImpostos**: Valor médio do adicional de bandeira com impostos.

## **Contribuições**

Contribuições são bem-vindas! Por favor, abra um **pull request** ou registre uma **issue** no repositório para sugestões, dúvidas ou melhorias.

## **Licença**

Esta biblioteca é distribuída sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.
