import { ensureDir } from 'fs-extra';
import { readFileSync, writeFileSync } from 'fs';
import axios from 'axios';
import { JSDOM } from 'jsdom'
import { NodeHtmlMarkdown } from 'node-html-markdown'
import showdown from 'showdown';

const converter = new showdown.Converter();

const prenoms = [
  'Camille',
  'Dominique',
  'Sacha',
  'Eden',
  'Noa',
  'Marley',
  'Morgan',
  'Charlie',
  'Louison',
  'Elijah',
  'Loïs',
  'Thaïs',
  'Driss',
  'Alix'];

const agentsNames = {
  'écrivain': 'écrivain',
  'agent public': 'agent public',
  'assistant_social': 'assistant social',
  'designer': 'designer des services publics',
  'militant_inclusivite': 'militant pour l\inclusivité numérique',
  'frise_chronologique': 'frise chronologique',
  'chercheur': 'chercheur en sciences sociales passionné par l\'étude des labyrinthes administratifs'
}

const tabTitles = new Set([
  'écrivain',
  'agent public',
  'assistant_social',
  'designer',
  // 'militant_inclusivite', 
  'frise_chronologique',
  'chercheur',
  // '_original',
]);

const prefixes = {
  'assistant_social': () => {
    const prenom1 = prenoms[parseInt(Math.random() * prenoms.length)];
    const prenom2 = prenoms[parseInt(Math.random() * prenoms.length)];
    return `<div class="post-it">Hello ${prenom1}, <br/>je pars en congés 2 semaines est-ce que tu pourrais reprendre ce dossier stp ? merci d'avance, je te revaudrais ça ! <br/>Bises, ${prenom2} </div>`
  },
  'designer': () => {
    return `<div class="header-agence">
    <h2>Agence Pour de Vrai Pour de Vrai</h2>
    <h1>Mission de conseil pour la task force « pour un numérique plus ♡&nbsp;inclusif&nbsp;♡ »</h1>
    <h3>Support pour la présentation du 12 décembre : «&nbsp;focus sur une étude de cas révélatrice des problématiques d'expérience utilisateur&nbsp;»</h3>
    </div>`
  },
  'écrivain': () => {
    const prenom1 = prenoms[parseInt(Math.random() * prenoms.length)];
    const prenom2 = prenoms[parseInt(Math.random() * prenoms.length)];
    return `<div class="header">
    Une nouvelle inédite de ${prenom1} ${prenom2}
    </div>`
  },
  'chercheur': () => {
    const prenom1 = prenoms[parseInt(Math.random() * prenoms.length)];
    const prenom2 = prenoms[parseInt(Math.random() * prenoms.length)];
    return `<div class="recherche-header">
    Brouillon de travail issu de l'enquête doctorale de ${prenom1} ${prenom2} en vue de la prochaine séance de séminaire de recherche doctorale du médiabal (12 décembre salle K013). Merci de ne pas partager !
    </div>`
  }
}

let dsv;
import('d3-dsv')
  .then(i => {
    dsv = i;
    const data = dsv.csvParse(readFileSync('inputs/folders/data.csv', 'utf8')).filter(id => id !== 'prompts' && id);
    const database = dsv.csvParse(readFileSync('outputs/input-clean-enriched.csv', 'utf8')).filter(id => id !== 'prompts' && id);

    const prompts = Array.from(tabTitles).map(id => {
      const path = `inputs/folders/prompts/${id}.md`;
      const md = readFileSync(path, 'utf8');
      const html = converter.makeHtml(md);
      return {
        id,
        html
      }
    })
    const html = `<!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>Dossiers services public plus</title>    
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anonymous+Pro:ital,wght@0,400;0,700;1,400;1,700&family=Caveat:wght@400..700&family=Fira+Code:wght@300..700&family=Instrument+Serif:ital@0;1&family=Ledger&family=Lexend:wght@100..900&family=Oranienbaum&display=swap" rel="stylesheet">
        <link rel="stylesheet" type="text/css" href="css/pagedjs-interface.css" />
        <link rel="stylesheet" type="text/css" href="css/dossiers.css" />
      </head>
      <body>
      ${data
        .filter(({ id }) => id !== 'prompts')
        .map(({ id, titre }) => {
          const item = database.find(d => d['ID expérience'] === id);
          const nbReponses = ['1', '2', '3'].filter(n => item[`Réponse structure ${n}`]);
          const pathOriginal = `inputs/folders/${id}/_original.md`;
          const mdOriginal = readFileSync(pathOriginal, 'utf8');
          const dateEcrit = new Date(item['Écrit le']);
          const dateReponse = new Date(item['Date de premiere réponse']);
          const nbJoursReponse = (dateReponse.getTime() - dateEcrit.getTime()) / (3600 * 24 * 1000);
          return `
          <section>
            <section class="piece cover">
              <div class="header">
                <div>
                  <h2>Bureau</h2>
                  <h2>Indépendant</h2>
                  <h2>Investigatif des données ouvertes</h2>
                  <h2>Services Publics +</h2>
                </div>
                
                <div>
                  <h3>Dossier n°${item['ID expérience']}</h3>
                  <h3>Intitulé : ${titre}</h3>
                </div>
              </div>
              <table>
                  ${[...Array(16).keys()].map(_i => `
                    <tr>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                    `).join('\n')}
                </table>
              <ul>
          ${[
              { key: 'Pseudonyme usager', name: 'Pseudonyme usager' },
              { key: 'Écrit le', name: 'Écrit le' },
              { key: 'Intitulé département usager', name: 'Département' },

              // { key: 'Ressenti usager', name: 'Ressenti usager' },
              { key: 'Démarches saisies par usager', name: 'Démarches saisies par usager' },
              { key: 'Accessibilité', name: 'Accessibilité' },
            ]
              .filter(({ key }) => (item[key] || '').trim().length)
              .map(({ key, name }) => `<li><strong>${name}</strong> : <span>${item[key]}</span></li>`)
              .join('\n')
            }
        ${[
              { key: 'Intitulé typologie', name: 'Intitulé typologie' },
              { key: 'Canaux Typologie', name: 'Canaux' },
              { key: 'Intitulé structure', name: 'Structures' },
              // { key: 'Réponse structure', name: 'Réponse structure' },
              // { key: 'Taux de similarité réponse IA structure', name: 'Taux de similarité réponse IA structure' },
            ]
              .map(({ key, name }) => {
                let values = ['1', '2', '3'].map(n => item[`${key} ${n}`] || '')
                  .filter(v => v.trim().length)
                values = Array.from(new Set(values)).join(', ');
                if (values.length) {
                  return `<li><strong>${name}</strong> : <span>${values.replace(/\|+/gm, '<br/>')}</span></li>`
                }
                return ''
              })
              .join('\n')
            }
</ul>
            </section>

            <!-- original -->
            <section class="piece file original">
                <h1>${titre}</h1>
                <h2>par ${item['Pseudonyme usager']}</h2>
                <div>
                ${converter.makeHtml(mdOriginal)}
                </div>
            </section>
            <!-- réponses -->
            ${['1', '2', '3']
              .filter(n => item[`Réponse structure ${n}`])
              .map(n => {
                return `
                <section class="piece file reponse">
                <h1>Réponse de la structure ${nbReponses > 1 ? `n°${n}` : ''} : ${item[`Intitulé structure ${n}`]}</h1>
                  <blockquote>
                    ${item[`Réponse structure ${n}`].replace(/\|+/gm, '<br/>')}
                  </blockquote>
                  <ul>
                  <li>Taux de similarité réponse IA&nbsp;:&nbsp;${item[`Taux de similarité réponse IA structure ${n}`]}%</li>
                  <li>Date de première réponse : ${item['Date de premiere réponse']} (temps de réponse&nbsp;${nbJoursReponse}&nbsp;jours)</li>
                  <ul>
                </section>
                `
              }).join('\n')

            }
            <!-- pièces générées -->

            ${Array.from(tabTitles)
              .sort()
              .map(tabId => {
                const path = `inputs/folders/${id}/${tabId}.md`;
                const md = readFileSync(path, 'utf8');
                const html = converter.makeHtml(md);
                return `
            <section class="piece file generated ${tabId.split(' ')[0]}">
            ${prefixes[tabId] ? prefixes[tabId]() : ''}
            ${html}
            </section>
            <section class="piece feedback">
            <div class="header">
              <h1>Fiche d'aide à la réflexion</h1>
              <ul>
                  <li>Cas : <strong>${titre}</strong> (ID&nbsp;expérience n° ${item['ID expérience']})</li>
                  <li>Agent factice support à la réflexion sur le cas : <strong>${agentsNames[tabId]}</strong></li>
              </ul>
              
            </div>
            <div class="feedback-section">
                <div class="question">
                  Dans ce document, quelles informations semblent intéressantes pour mieux comprendre la situation/le contexte du témoignage initial ?
                </div>
                <div class="response-space">
                </div>
            </div>
            <div class="feedback-section">
                <div class="question">
                  Qu'est-ce que la personne ne voit pas ? Fait-elle des erreurs ? Qu'est-ce qui vous surprend dans le document produit ?
                </div>
                <div class="response-space">
                </div>
            </div>
            <div class="feedback-section">
                <div class="question">
                  Quelles organisations ou personnes faudrait-il impliquer d’autres pour une meilleure prise en compte du témoignage ? 
                </div>
                <div class="response-space">
                </div>
            </div>
            </section>
            `
              }).join('\n\n')
            }
          </section>
            <!-- fiches prompts -->
              ${prompts.map(({ id, html }) => {
              return `
                  <section class="prompt" id="${id}">
                  <h3>Prompt agent factice : ${agentsNames[id]}</h3>
                    <div class="content">
                    ${html}
                    </div>
                    <div class="footer">
                      Modèle utilisé : ChatGPT-5
                    </div>
                  </section>
                  `
            }).join('\n\n')
            }
                  `
        }).join('\n')
      }
            
        <script type="text/javascript" src="js/paged.polyfill.js"></script>
      </body>
    </html>`
    writeFileSync('outputs/dossiers.html', html, 'utf8');
  });