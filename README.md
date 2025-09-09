# Prérequis pour l'installation

1. Installer [node.js](https://nodejs.org/fr)
2. Installer [git](https://git-scm.com/)

Puis copier-coller le code suivant dans le terminal :

```bash
git clone github.com/robindemourat/servicespublicplus-explo
cd servicespublicplus-explo
npm i
```

Puis copier-coller le gros csv obtenu sur le site dans le dossier `inputs` et le renommer `export-experiences.csv`.

Puis depuis le terminal, se rendre dans le dossier `servicespublicplus-explo` puis lancer la commande suivante :

```bash
node fiches.js
```

Le contenu résultant se trouve dans le dossier `output`.