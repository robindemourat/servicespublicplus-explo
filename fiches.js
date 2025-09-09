const fs = require('fs');

import('d3-dsv')
  .then(dsv => {
    // chargement du fichier
    let input = fs.readFileSync('inputs/export-experiences.csv', 'utf8');
    input = dsv.dsvFormat(";").parse(input);
    const outputPath = 'outputs/index.html';
    const data = input
    // décommenter la ligne ci-dessous (et commenter la suite avant const outputHTML) pour filtrer aux réponses IA
      // .filter(d => d['Taux de similarité réponse IA structure 1'] === '100')
      // commenter les lignes ci-dessous jusque const outputHTML pour enlever le filtre sur la description
    .sort((a, b) => {
      if (a['Description'].length > b['Description'].length) {
        return -1;
      }
      return 1;
    })
    .slice(0, 200);
    // génération du template du contenu HTML
    const outputHTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Fiches services public plus</title>
  </head>
  <body>
  ${data.map(datum => {
      return `
<section class="page">
<h1>${datum['Titre']}</h1>
<h3>${datum['Pseudonyme usager']} - ${datum['Écrit le']}</h3>
<blockquote>
<p>
<strong>
${datum['Description']}
</strong>
</p>
</blockquote>

<ul>
${[
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
              return `<li><strong>${name}</strong> : <span>${values}</span></li>`
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
</html>`
    fs.writeFileSync(outputPath, outputHTML, 'utf8');
    console.log('done, bye');
  })