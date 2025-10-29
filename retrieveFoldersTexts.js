import { ensureDir } from 'fs-extra';
import { writeFileSync } from 'fs';
import axios from 'axios';
import { JSDOM } from 'jsdom'
import { NodeHtmlMarkdown } from 'node-html-markdown'

const DIR_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkJyK7p1w5JQ_HOL0nF33imQCidoVHap1GfuPlRw-ffPs5erIkh9AAr5DlDglgHRXF5axo6sSvta1l/pub?output=csv'

let dsv;
import('d3-dsv')
  .then(i => {
    dsv = i;
    return ensureDir('inputs/folders')
  })
  .then(() => {
    return axios(DIR_URL)
  })
  .then(({ data: str }) => {
    const data = dsv.csvParse(str);
    // store source data
    writeFileSync(`inputs/folders/data.csv`, dsv.csvFormat(data), 'utf8');
    return Promise.all(data.filter(d => d.url).map(datum => {
      return new Promise((resolve, reject) => {
        console.log('process %s – %s', datum.id, datum.titre);
        ensureDir(`inputs/folders/${datum.id}`)
          .then(() => axios(datum.url))
          .then(({ data: html }) => {
            const { document } = (new JSDOM(html)).window;
            const content = document.querySelector('.doc-content');
            const tabTitles = new Set([
              'écrivain','agent public', 'assistant_social', 'designer', 'militant_inclusivite', 'frise_chronologique', 'chercheur', '_original'
            ]);
            // console.log(content);
            const byTabs = Array.from(content.childNodes).reduce((res, block) => {
              if (block.className.includes('title') && tabTitles.has(block.textContent.trim())) {
                const id = block.textContent.trim();
                // console.log(id);
                const newItem = {
                  id,
                  blocks: []
                }
                return [...res, newItem]
              } else {
                if (res.length) {
                  // console.log(block.tagName, block, block.outerHTML)
                  res[res.length - 1].blocks.push({
                    text: block.outerHTML // block.textContent.trim()
                  })
                }
                return res;
              }
            }, []);
            // console.log(byTabs);
            Promise.all(byTabs.map(({ id, blocks }) => {
              const path = `inputs/folders/${datum.id}/${id}.md`;
              // const text = id === 'frise_chronologique' ? blocks.map(({text}) => text).join('\n\n').trim() : blocks.map(({ text }) => {
              //   return NodeHtmlMarkdown.translate(text);
              // }).join('\n\n').trim();
              const text = blocks.map(({text}) => text).join('\n\n').trim()
              // console.log(text)
              console.log('write', path);
              writeFileSync(path, text, 'utf8');
              return Promise.resolve();
            }))
            return resolve();
          })
          .catch(reject)
      })
    }))
  })
  .then(() => {
    console.log('all done, bye !')
  })