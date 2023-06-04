/* TRABALHO 2 ANALIZADOR SEMANTICO - COMPILADORES - PROF: JACQUELINE
Author: Adrian Garcia Valdes
Mátricula: 201620024

Trabalho feito em javascript, utilizando o node para executar o codigo.
Para executar basta no terminal (com nodejs ja instalado na máquina, podendo ser qualquer versão):
    - node src/index.js -
*/

import fs from 'fs'// Modulo para utilizar tratativas com arquivos de diferentes formatods

function extractVariable(pilha, type, line) {
  const regex = /(\w+)(?:\s*=\s*([^,]+))?/g;

  let match;
  while ((match = regex.exec(line)) !== null) {
    const variable = match[1];
    const value = match[2] ?? null;
    if (variable === 'NUMERO' || variable === 'CADEIA') continue;
    pilha[0].variaveis = {
      ...pilha[0].variaveis,
      [variable]: {
        value,
        type,
      }
    }
  }
}

function printVariable(pilha, line, numeroLinha) { // Funçao para processar os PRINT's no código
  const [print, variable] = line.split(' ');
  const escopo = pilha.find(escopo => escopo.variaveis[variable])
  if (!escopo) console.log('\x1b[31m%s\x1b[0m', `[Linha: ${numeroLinha}] - Variável ${variable} não declarada`) //Se a variavel encontrada n for achado no escopo, ela é assumida como não declarada
  else console.log(`Print ${variable}: `, `${escopo.variaveis[variable].value}`)
}

function isNumber(variable) {
  return !isNaN(parseInt(variable)); // Utiliza isNaN que basicamente é um metodo que vai retornar true ou false se o elemento verificado não é um numero
}

function changeVariableValueOnAtribution(pilha, line, numeroLinha) { //Função para tratar atribuições após as declarações
  const regex = /(\w+)\s*=\s*([^,]+)/g; // Expressão regular para identificar cadeias de caracteres do tipo 'x = v' ou 'x' onde v pode ser tanto uma string qnt um número
  let match;
  while ((match = regex.exec(line)) !== null) {
    const variable = match[1];
    const value = match[2] ?? null;
    const escopo = pilha.find(escopo => escopo.variaveis[variable])
    if (!escopo) console.log('\x1b[31m%s\x1b[0m', `[Linha: ${numeroLinha}] - Variável ${variable} não declarada`)
    else {
      const variableStorageType = pilha[0].variaveis[variable].type
      if (isNumber(value) && variableStorageType === 'string' || !isNumber(value) && variableStorageType === 'number') { // Verificação se atribuiçao corresponde ao tipo da variavel a ser mudada
        console.log('\x1b[31m%s\x1b[0m', `[Linha: ${numeroLinha}] - Variável "${variable}" declarada anteriormente como "${variableStorageType}"`)
      } else {
        pilha[0].variaveis[variable] = {
          ...pilha[0].variaveis[variable],
          value,
        };
      }
    }
  }
}

function analisadorSemantico(codigo) {
  const pilhaEscopo = [];
  const linhaPorLinha = codigo.split('\n').map(linha => linha.trim()).filter(line => line !== '');
  console.log('+-----------------------------------------------------------------------------------------+');
  console.log('|                           ANALISADOR SEMANTICO - ADRIAN VALDES                          |');
  console.log('+-----------------------------------------------------------------------------------------+');
  console.log('\n Prints do programa lido:');

  linhaPorLinha.forEach((line, index) => {
    const linhaCount = index + 2;

    if (line.includes('BLOCO')) { //Caso identifique a palavra BLOCO o programa vai assumir q essa parte do código ja é um novo escopo e adicionar à pilha de escopos
      pilhaEscopo.unshift({
        escopo: pilhaEscopo.length + 1,
        variaveis: null
      })
    }
    if (line.includes('FIM')) { // Ao chegar em um final bloco aquele escopo referente (o ultimo adicionado) a esse fim, é tirado da pilha
      pilhaEscopo.shift();
    }


    if (line.includes('NUMERO')) {
      extractVariable(pilhaEscopo, 'number', line);
    } else if (line.includes('CADEIA')) {
      extractVariable(pilhaEscopo, 'string', line);
    } else {
      changeVariableValueOnAtribution(pilhaEscopo, line, linhaCount)
    }
    if (line.includes('PRINT')) {
      printVariable(pilhaEscopo, line, linhaCount)
    }
  })
}


function main() {
  try {
    const codigo = fs.readFileSync(`src/${'ex1.cic'}`, 'utf-8');
    analisadorSemantico(codigo);
  } catch (err) {
    console.log(err);
  }
}

main();