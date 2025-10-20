const fs = require('fs');

import('d3-dsv')
  .then(dsv => {
    // chargement du fichier en csv
    let input = fs.readFileSync('inputs/export-experiences.csv', 'utf8');
    // nettoyage des retours chariots
    input = input.split('\n').reduce((res, line, i) => {
      if (i > 1 && (line.match(/^([^;]+)$/gm) || !line.match(/^(\d+)/))) {
        return res + '|' + line.trim();
      }
      return res + '\n' + line.trim();
    }, '').trim();
    input = dsv.dsvFormat(";").parse(input);

    const clusters = dsv.csvParse(fs.readFileSync('inputs/Cluster clean Cortexte.csv', 'utf8'));
    const problemes = dsv.tsvParse(fs.readFileSync('inputs/LLM_Extraction_Problemes_Services_Publics_Conforme.csv', 'utf8'));

    const clustersMap = new Map();
    const problemsMap = new Map();
    clusters.forEach(({ID_exprien,PC_ITFull1}) => clustersMap.set(ID_exprien,PC_ITFull1))

    problemes.forEach(({ID, Problème, Contexte}) => {
      const item = {probleme: Problème, contexte: Contexte};
      if (!problemsMap.get(ID)) {
        problemsMap.set(ID, [item])
      } else {
        const existing = problemsMap.get(ID);
        problemsMap.set(ID, [...existing, item])
      }
    })
    // const inputJSON = fs.readFileSync('inputs/export-experiences.json', 'utf8').trim();
    // const cleanJSON = inputJSON.split('\n')
    // .map((line, i) => {
    //   if (i >= 50000 && i%50000 === 0) {
    //     // delete last char
    //     return line.substring(0, line.length - 2) + ',';
    //   } else if (i >= 50000 && i%50000 === 1) {
    //     // delete first char
    //     console.log('test: ', line.substring(1))
    //     return line.substring(1);
    //   }
    //   return line
    // })
    // .join('\n')
    // const input = JSON.parse(cleanJSON)

    const inputCleanCsv = dsv.csvFormat(input);
    fs.writeFileSync(`outputs/input-clean.csv`, inputCleanCsv, 'utf8');
    const inputEnriched = input.map(item => {
      const outputItem = {...item}
      const id = item['ID expérience']
      if (clustersMap.get(id)) {
        outputItem.cluster = clustersMap.get(id);
      }
      if (problemsMap.get(id)) {
        const pbs = problemsMap.get(id);
        outputItem.problemes = pbs.map(p => p.probleme);
        outputItem.problemes_avec_contextes = pbs.map(({probleme, contexte}) => `${probleme} (${contexte})`)
      }
      return outputItem;
    });
    fs.writeFileSync(`outputs/input-clean-enriched.csv`, dsv.csvFormat(inputEnriched), 'utf8');

    const baseFilter = input.filter(d => {
      const respIA = ['1', '2', '3'].find(n => d[`Taux de similarité réponse IA structure ${n}`] !== '' && +d[`Taux de similarité réponse IA structure ${n}`] >= 50);
      const neg = d['Ressenti usager'] === 'Négatif';
      return respIA && neg;
    });

    // let nbAvecRespIa = 0;
    const iaResponses = input.reduce((res, d) => {
      // let hasIt = false;
      ['1', '2', '3']
        .forEach(n => {

          const respIA = d[`Taux de similarité réponse IA structure ${n}`] !== '' && +d[`Taux de similarité réponse IA structure ${n}`] >= 50;
          if (respIA) {
            hasIt = true;
            const respText = d[`Réponse structure ${n}`];
            const item = {
              text: respText,
              structure: d[`Intitulé structure ${n}`]
            };
            res.push(item)
          }
        });
      // if (hasIt && d['Ressenti usager'] === 'Négatif') {
      //   nbAvecRespIa++;
      // }
      return res;
    }, []);
    // console.log('nb resp avec ia', nbAvecRespIa, input.length);
    const sets = [
      // {
      //   fileName: 'respIA',
      //   title: 'Réponses d\'IA sûr à 100%',
      //   data: input.filter(d => d['Taux de similarité réponse IA structure 1'] === '100')
      // },

      {
        fileName: 'baseFilter',
        title: 'Réponse IA>50%, exp négative',
        data: baseFilter
      },
      {
        fileName: 'min1000',
        title: 'Réponse IA>50%, exp négative, plus de 1000 caractères',
        data: baseFilter.filter(d => d['Description'].length > 1000)
      },
      {
        fileName: 'min2000',
        title: 'Réponse IA>50%, exp négative, plus de 2000 caractères',
        data: baseFilter.filter(d => d['Description'].length > 2000)
      },
      {
        fileName: 'min2000_au_moins_un_acronyme',
        title: 'Réponse IA>50%, exp négative, plus de 2000 caractères, au moins un acronyme',
        data: baseFilter.filter(d => d['Description'].length > 2000 && d['Description'].match(/\b[A-Z]{3,20}\b/))
      },
      {
        fileName: 'min1000plrs_structures',
        title: 'Réponse IA>50%, exp négative, plus de 1000 caractères, plusieurs structures impliquées',
        data: baseFilter
          .filter(d => d['Description'].length > 1000)
          .filter(d => {
            const keyBase = 'Intitulé structure';
            const nbNotEmpty = [1, 2, 3].filter(n => d[`${keyBase} ${n}`]).length;
            // if(d['Intitulé structure 2']) {
            //   console.log('ok', d['Intitulé structure 2'], nbNotEmpty)
            // }
            return nbNotEmpty > 1;
          })
          .sort((a, b) => {
            if (a['Description'].length > b['Description'].length) {
              return -1;
            }
            return 1;
          })
      },
      // {
      //   fileName: 'romans',
      //   title: 'Les 200 réponses les plus longues (pour comparaison)',
      //   data: input
      //   .sort((a, b) => {
      //     if (a['Description'].length > b['Description'].length) {
      //       return -1;
      //     }
      //     return 1;
      //   })
      //   .slice(0, 200)
      // }
    ];
    sets.forEach(({ fileName, data, title }) => {
      const outputHTML = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>${title} – Fiches services public plus</title>
  </head>
  <body>
<section class="page">
<h1>Retours service public plus</h1>
<ul>
<li>nom du fichier : ${fileName}</li>
<li>nombre de fiches : ${data.length}</li>
<li>description du filtre : ${title}</li>
</ul>
</section>
  ${data.map(datum => {
        return `
<section class="page">
<h1>${datum['Titre']}</h1>
<h3>${datum['Pseudonyme usager']} – le ${new Date(datum['Écrit le']).toLocaleDateString()}</h3>
<blockquote>
<p>
<strong>
${datum['Description'].replace(/\|+/gm, '<br/>')}
</strong>
</p>
</blockquote>

<ul>
${[
            { key: 'ID expérience', name: 'ID expérience' },
            { key: 'Ressenti usager', name: 'Ressenti usager' },
            { key: 'Démarches saisies par usager', name: 'Démarches saisies par usager' },
            { key: 'Intitulé département usager', name: 'Département' },
            { key: 'Accessibilité', name: 'Accessibilité' },
          ]
            .filter(({ key }) => (datum[key] || '').trim().length)
            .map(({ key, name }) => `<li><strong>${name}</strong> : <span>${datum[key]}</span></li>`)
            .join('\n')
          }
${[
            { key: 'Intitulé typologie', name: 'Intitulé typologie' },
            { key: 'Canaux Typologie', name: 'Canaux' },
            { key: 'Intitulé structure', name: 'Structures' },
            { key: 'Réponse structure', name: 'Réponse structure' },
            { key: 'Taux de similarité réponse IA structure', name: 'Taux de similarité réponse IA structure' },
          ]
            .map(({ key, name }) => {
              let values = ['1', '2', '3'].map(n => datum[`${key} ${n}`] || '')
                .filter(v => v.trim().length)
              values = Array.from(new Set(values)).join(', ');
              if (values.length) {
                return `<li><strong>${name}</strong> : <span>${values.replace(/\|+/gm, '<br/>')}</span></li>`
              }
              return ''
            })
            .join('\n')
          }
        
          ${[
            { key: 'Accessibilité', name: 'Accessibilité' },
            { key: 'Information/Explication', name: 'Information/Explication' },
            { key: 'Relation', name: 'Relation' },
            { key: 'Réactivité', name: 'Réactivité' },
            { key: 'Simplicité/Complexité', name: 'Simplicité/Complexité' },
          ]
            .filter(({ key }) => (datum[key] || '').trim().length)
            .map(({ key, name }) => `<li><strong>${name}</strong> : <span>${datum[key]}</span></li>`)
            .join('\n')

          }
</ul>
</section>
      `
      })
          .join('\n')
        }
<style>


section {
  page-break-after: always;
}

@page {
  size: A5 portrait;
}
</style>
  </body>
</html>`;
      fs.writeFileSync(`outputs/${fileName}.html`, outputHTML, 'utf8');
      fs.writeFileSync(`outputs/${fileName}.csv`, dsv.csvFormat(data), 'utf8');
    })
    const iaResponsesPath = 'outputs/iaResponses.html';
    const iaResponsesHTML = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Fiches services public plus</title>
  </head>
  <body>
  ${iaResponses.map(datum => {
      return `
<section class="page">
<p>${datum['text']}</p>
</section>
      `
    })
        .join('\n')
      }
<style>


section {
  page-break-after: always;
}

@page {
  size: A5 portrait;
}
</style>
  </body>
</html>`
    fs.writeFileSync(iaResponsesPath, iaResponsesHTML, 'utf8');


    fs.writeFileSync('outputs/résumé.txt', `Résumé des générations :
${sets.map(({ fileName, title, data }) => `* ${fileName}.csv & ${fileName}.html : ${title} (${data.length} expériences)`).join('\n')}`, 'utf8')

    console.log('done, bye');
  })