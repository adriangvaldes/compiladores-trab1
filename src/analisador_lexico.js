/* TRABALHO 1 ANALIZADOR LÉXICO - COMPILADORES - PROF: JACQUELINE
Author: Adrian Garcia Valdes
Mátricula: 201620024

Trabalho feito em javascript, utilizando o node para executar o codigo.
Para executar basta no terminal (com nodejs ja instalado na máquina, podendo ser qualquer versão):
    - node src/index.js -
*/

const fs = require('fs'); // Modulo para utilizar tratativas com arquivos de diferentes formatods

// Definir os padrões de tokens usando expressões regulares
const palavrasReservadas = ['programa', 'fim_programa', 'caso', 'entao', 'fim_caso', 'leia', 'def', 'imprima', 'return', '(', ')', '<', '-', ':']

// Função para realizar a análise léxica
function analisarLexico(codigo) {
  const tokens = [];
  /* tokens é um Array onde se aramzena todos os tokens lidos no código.
      no caso um array de objetos do tipo [
        {
          [tk_tipo_id]: valor_do_token;
          tipo: tipo_de_token (aqui pode ser: palavraReservada ou simbolo)
          linha: x, (linha onde a partir do primeiro caracter da palavra extraida)
          coluna: y, (coluna onde a partir do primeiro caracter da palavra extraida)
        }
      ]
  */
  let linha = 1;
  const errors = [];
  let currentToken = '';
  let coluna = 1;
  let estado = 0;
  let varError = false; // Uma flag para dizer se o currentToken lido no momento é uma variável inválida ou não
  let colunaComment;  //Uma variavel auxiliar para os casos do comentário pois caso seja comentarios de multiplas linha era necessário uma tratativa adicional

  function resetEstado() {
    estado = 0;
    currentToken = '';
    colunaComment = null;
  }

  function saveToken({ tokenToSave, tipo, identificador }) {
    tokens.push({
      [`tk_${identificador}`]: tokenToSave,
      linha: identificador === 'iden_coment' ? linha - 1 : linha,
      coluna: colunaComment ? colunaComment : coluna - tokenToSave.length,
      tipo
    });
    resetEstado();
  }

  function saveError({ msg, currentChar }) {
    resetEstado();
    errors.push({
      linha,
      coluna,
      msg: `'${currentChar}' ${msg}`
    })
  }

  function isNumber(char) {
    return !isNaN(parseInt(char)); // Utiliza isNaN que basicamente é um metodo que vai retornar true ou false se o elemento verificado não é um numero
    // isNaN = is Not a Number. Aplicando dentro de parseInt(char) ou seja pegando o char lido convertendo pra inteiro, caso n seja retornara NaN
  }

  function isLetter(char) {        //Aqui utiliza-se um regex apegas para verificar se o char lido é uma letra maiuscula ou minuscula. aplicando o regex
    return /[a-zA-Z]/.test(char)  // '/[a-zA-Z]/' no metodo test() que vai pegar esse regex e testar no char lido, retorno sendo true ou false
  }

  console.log('-------ARQUIVO DE PROGRAMA FICTICIO .CIC LIDO:--------\n');
  console.log(codigo.split('\n').map((item, index) => `[${index + 1}]  ${item}`).join('\n'), '\n\n'); // Exibindo código lido no terminal

  for (let cursor = 0; cursor < codigo.length; cursor++) {
    const char = codigo[cursor];

    function moveCursorBack() {                         // Funçao que vai mover o cursor para um estado anterior e diminuindo o contador de coluna tbm pois se não teremos erro,
      if (codigo[cursor] === '\n') linha = linha - 1;   // Caso aquele char naquele momento for um \n ele vai diminuir o numero de linha para evitar a contagem incorreta de linhas
      coluna--;
      cursor--;
    }


    currentToken += char;  // Variavel q armazena o token lido atualmente;
    switch (estado) {  // Aqui se testa para cada estado do automato feito.
      case 0:
        switch (char) {
          case '"':
            estado = 8;
            break;

          case '+':
          case '-':
            estado = 1;
            break;

          case '_': // TODO talvez usar um regez para verificar 
            estado = 13;
            break;

          case '/': // TODO talvez usar um regez para verificar 
            estado = 18;
            break;

          case '<': // TODO talvez usar um regez para verificar 
            estado = 23;
            break;

          case '(': // TODO talvez usar um regez para verificar 
            estado = 25;
            break;

          case ')': // TODO talvez usar um regez para verificar 
            estado = 26;
            break;

          case ',':
            estado = 29;
            break;

          case ':':
            estado = 30;
            break;

          default: //Caso n tenha nenhuma ocorrencia cai no estado de rejeição
            if (isLetter(char)) estado = 11;
            else resetEstado();
            break;
        }
        break;
      case 1:
        if (isNumber(char)) estado = 2;
        else {
          saveError({
            msg: 'Não é um numero válido!!',
            currentChar: currentToken
          })
        }
        break;
      case 2:
        switch (char) {
          case '.': // Caso char lido for um '.' vai para o estado 3
            estado = 3
            break;
          default: // Caso n for nenhum dos casos
            if (isNumber(char)) estado = 2
            else {
              saveToken({
                tokenToSave: currentToken.slice(0, -1),
                identificador: 'iden_num',
                tipo: 'simbolo'
              });
              moveCursorBack();
            }
            break;
        }
        break;
      case 3:
        if (isNumber(char)) estado = 4
        else {
          saveError({
            msg: 'Não é um numero válido!!',
            currentChar: currentToken
          })
        }
        break;
      case 4:
        switch (char) {
          case isNumber(char):
            estado = 4;
            break;
          case 'e':
          case 'E':
            estado = 5;
            break;
          case '\n': // Caso char lido for um '\n' ou ' ' assume-se que terminou aquela palavra então
          case ' ':
            saveToken({
              tokenToSave: currentToken,
              identificador: 'iden_num',
              tipo: 'simbolo'
            });
            break;
          default:
            if (isNumber(char)) estado = 4;
            else saveError({
              msg: 'Não é um numero válido!!',
              currentChar: currentToken
            })
            break;
        }
        break;
      case 5:
        if (char === '+' || char === '-') estado = 6;
        else {
          saveError({
            msg: 'Não é um numero válido!!',
            currentChar: currentToken
          })
        }
        break;
      case 6:
        if (isNumber(char)) estado = 7;
        else saveError({
          msg: 'Não é um numero válido!!',
          currentChar: currentToken
        });
        break;
      case 7:
        if (isNumber(char)) estado = 7;
        if (char === '\n' || char === ' ') saveToken({
          tokenToSave: currentToken.slice(0, -1),
          identificador: 'iden_num',
          tipo: 'simbolo'
        })
        break;
      case 8:
        if (char === '"') estado = 9;
        else if (char === '\n') saveError({
          currentChar: char,
          msg: `Cadeia inválida (fechada na linha ${linha})`
        })
        else estado = 8;
        break;
      case 9:
        saveToken({
          tokenToSave: currentToken.slice(0, -1),
          identificador: 'iden_cadeia',
          tipo: 'simbolo'
        })
        moveCursorBack();
        break;

      case 11:
        if (isLetter(char) || char === '-' || isNumber(char)) estado = 12
        else {
          saveError({
            msg: 'Variável não válida!',
            currentChar: currentToken
          })
          varError = true;
        }
        break;
      case 12:
        if (isLetter(char) || char === '_' || isNumber(char)) estado = 12
        else {
          if (palavrasReservadas.includes(currentToken.slice(0, -1)))
            saveToken({
              tokenToSave: currentToken.slice(0, -1),
              identificador: currentToken.slice(0, -1),
              tipo: 'palavraReservada'
            });
          else if (!varError) {
            saveToken({
              tokenToSave: currentToken.slice(0, -1),
              identificador: 'iden_var',
              tipo: 'simbolo'
            })
          } else resetEstado()
          if (char === '\n' || char === ' ' || char === ',') varError = false;
          moveCursorBack();
        };
        break;

      case 13:
        if (char === '_') estado = 14;
        else saveError({
          currentChar: char,
          msg: 'Lexema de funçao inválida!'
        })
        break;
      case 14:
        if (isLetter(char)) estado = 15;
        else saveError({
          currentChar: char,
          msg: 'Lexema de funçao inválida!'
        })
        break;
      case 15:
        if (isLetter(char) || isNumber(char)) estado = 15;
        else if (char === '_') estado = 16;
        else saveError({
          currentChar: char,
          msg: 'Lexema de funçao inválida!'
        })
        break;
      case 16:
        if (char === '_') estado = 17;
        else saveError({
          currentChar: char,
          msg: 'Lexema de funçao inválida!'
        })
        break;
      case 17:
        saveToken({
          tokenToSave: currentToken.slice(0, -1),
          identificador: 'iden_func',
          tipo: 'simbolo'
        })
        moveCursorBack();
        break;
      case 18:
        if (char === '/') estado = 19;
        else if (char === '*') estado = 27;
        else {
          saveError({
            currentChar: char,
            msg: 'Lexema de comentário inválido!'
          })
          moveCursorBack();
        }
        break;
      case 19:
        if (codigo[cursor + 1] === '\n') colunaComment = coluna - currentToken.length; // Salvando a info da coluna do comentario para na próx iteração n perder ela
        if (char === '\n') estado = 20;
        else estado = 19;
        break;
      case 20:
        saveToken({
          tokenToSave: currentToken.slice(0, -1).replaceAll('\n', ''),
          identificador: 'iden_coment',
          tipo: 'simbolo'
        })
        moveCursorBack(true);
        break;

      case 21:

        break;
      case 22:

        break;
      case 23:
        if (char === '-') estado = 24;
        else saveError({
          currentChar: char,
          msg: 'Lexema de atribuição inválido'
        })
        break;
      case 24:
        saveToken({
          tokenToSave: currentToken.slice(0, -1),
          identificador: 'iden_atrib',
          tipo: 'palavraReservada'
        })
        moveCursorBack();
        break;
      case 25:
        saveToken({
          tokenToSave: currentToken.slice(0, -1),
          identificador: 'abre_par',
          tipo: 'palavraReservada'
        })
        moveCursorBack();
        break;
      case 26:
        saveToken({
          tokenToSave: currentToken.slice(0, -1),
          identificador: 'fecha_par',
          tipo: 'palavraReservada'
        })
        moveCursorBack();
        break;

      case 27:
        if (char === '*') {
          estado = 28;
          colunaComment = coluna;
        } else estado = 27;
        break;

      case 28:
        if (char === '/') estado = 20;
        else {
          saveError({
            currentChar: char,
            msg: 'Lexema de comentário inválido!'
          })
          moveCursorBack();
        }
        break;

      case 29:
        saveToken({
          tokenToSave: currentToken.slice(0, -1),
          identificador: 'virgula',
          tipo: 'palavraReservada'
        })
        moveCursorBack();
        break;

      case 30:
        saveToken({
          tokenToSave: currentToken.slice(0, -1),
          identificador: 'dois_pontos',
          tipo: 'palavraReservada'
        })
        moveCursorBack();
        break;
      default:
        break;
    }
    coluna++;
    if (char === '\n') coluna = 1
    if (char === '\n') linha++;
  }

  const dataFormattedTotableSymbols = tokens
    .filter(token => token.tipo === 'simbolo').map((token, index) => { // FILTRANDO PARA EXTRAIR APENAS OS TOKENS DO TIPO SIMBOLO
      const labels = Object.keys(token)
      return {
        POS: index + 1,
        TOKEN: labels[0],
        LEXEMA: token[labels[0]],
        ['POS NA ENTRADA']: `(${token[labels[1]]}, ${token[labels[2]]})`
      }
    })
    .reduce((acc, item) => { // REALIZANDO A TRATATIVA PARA MERGEAR OS ITENS DUPLICADOS
      const repeatedValue = acc.find(token => token.LEXEMA === item.LEXEMA);
      if (repeatedValue) {
        const aux = acc.map(token => {
          if (token.LEXEMA === repeatedValue.LEXEMA) {
            return {
              ...token,
              ['POS NA ENTRADA']: `${token['POS NA ENTRADA']}; ${item['POS NA ENTRADA']}`
            }
          } else return {
            ...token,
          }
        })
        return [...aux]
      } else return [...acc, item]
    }, [])
    .map((item, index) => ({
      ...item,
      POS: index + 1,
    }))

  const dataFormattedTotableTokensRecognized = tokens
    .map((token) => { // FILTRANDO PARA EXTRAIR APENAS OS TOKENS DO TIPO SIMBOLO
      const labels = Object.keys(token)
      return {
        TOKEN: labels[0],
        USO: 1,
      }
    })
    .reduce((acc, item) => { // REALIZANDO A TRATATIVA PARA MERGEAR OS ITENS DUPLICADOS
      const repeatedValue = acc.find(token => token.TOKEN === item.TOKEN);
      if (repeatedValue) {
        const aux = acc.map(token => {
          if (token.TOKEN === repeatedValue.TOKEN) {
            return {
              ...token,
              USO: token.USO + 1,
            }
          } else return {
            ...token,
          }
        })
        return [...aux]
      } else return [...acc, item]
    }, [])

  const totalUsos = dataFormattedTotableTokensRecognized.reduce((acc, element) => acc + element.USO, 0)

  dataFormattedTotableTokensRecognized.push({
    TOKEN: 'TOTAL',
    USO: totalUsos
  })

  const allSymbolsOccurrence = tokens.map((token, index) => { // FILTRANDO PARA EXTRAIR APENAS OS TOKENS DO TIPO SIMBOLO
    const labels = Object.keys(token);
    const tokenInSymbolsTable = dataFormattedTotableSymbols.find(element => element.TOKEN === labels[0])
    return {
      LIN: token[labels[1]],
      COL: token[labels[2]],
      TOKEN: labels[0],
      LEXEMA: token.tipo !== 'palavraReservada' ? token[labels[0]] : '                                                                  ',
      ['POS TAB SIM']: tokenInSymbolsTable?.POS ?? '         '
    }
  })

  console.log('+--------------------------------------------------------------------------------------------------------------------------------------+')
  console.log('|                                                          TABELA DE SIMBOLOS                                                          |')
  console.log('+--------------------------------------------------------------------------------------------------------------------------------------+')
  console.table(dataFormattedTotableSymbols)

  console.log('\n')

  console.log('+--------------------------------------------------------------------------------------------------------------------------------------+')
  console.log('|                                                         TOKENS RECONHECIDOS                                                          |')
  console.log('+--------------------------------------------------------------------------------------------------------------------------------------+')
  console.table(allSymbolsOccurrence)

  console.log('\n')


  console.log('+-----------------------------------------+')
  console.log('| TABELA RESUMO DE OCORRÊNCIAS DOS TOKENS |')
  console.log('+-----------------------------------------+')
  console.table(dataFormattedTotableTokensRecognized)
  console.log('\n')

  if (errors.length > 0) {
    console.log('!-------------------------------------------------------!')
    console.log('!                         ERROS                         !')
    console.log('!-------------------------------------------------------!')
    const errorsTable = errors.map((error) => { // FILTRANDO PARA EXTRAIR APENAS OS TOKENS DO TIPO SIMBOLO
      return {
        LIN: error.linha,
        COL: error.coluna,
        MSG: error.msg,
      }
    })
    console.table(errorsTable)
  }
}

// Função principal
function main() {
  try {
    const codigo = fs.readFileSync(`src/${'ex_2.cic'}`, 'utf-8');
    analisarLexico(codigo);
  } catch (err) {
    console.log(err);
  }
}

main();
