# Eyetunes

Eyetunes est une programmation vidéo associée à un dispositif de diffusion présentée pour la première fois dans le cadre d’*écoutez voir !*, exposition de design graphique au Bel Ordinaire du 15 avril au 27 juin 2015.

## Écoutez voir

Eyetunes, en référence à un populaire lecteur de média, pourrait se traduire par musiques pour l’œil. Il s’agit d’une sorte de Scopitone de l’ère numérique, soit un juke- box vidéo proposant aux visiteurs une sélection internationale de 36 clips réalisés par des artistes et des graphistes contemporains. Produits pour l’essentiel par ordinateur, ces courts films d’animation empruntent la voie de l’épure, de l’abstraction, de la géométrie et du rythme visuel pour atteindre la synchronisation parfaite du son et de l’image, dans la longue lignée du cinéma graphique expérimental du siècle passé. Contemplatives ou exta- tiques, minimales ou chatoyantes, ces partitions visuelles puisent dans le vaste répertoire des musiques électroniques actuelles, offrant une variété de tonalités et d’ambiances.

## Équipe

Programmation artistique : [Bertrand Grimault / association Monoquini](http://monoquini.net/)   
Table tactile & développement : [Guillaume Batista-Pina](http://guillaumebatistapina.com/) & [Julien Bidoret](http://accentgrave.net/)  
Commissariat d’exposition : [Jean-Marc Saint-Paul](http://nuancierfantone.fr/) & Julien Bidoret  
Films de : Nicolas Berthelot, Jono Brandel, Chris Casady, D-Fuse, Carlin Diaz, Alexander Dupuis, Jan Goldfuß, Karø Goldt, Nic Hamilton, Manuel Knapp, Lia, Maia Gusberti, David Muth, n:ja, Peder Norrby, Eduardo Omine, Keita Onishi, John Osborne, Michaela Schwentner, Semiconductor, Alexander Stewart, Tekton, Johannes Timpernage, Tinhoko, Shogo Tsurii, Markus Wambganss, Zeitguised, Rogier Van Der Zwaag.

## Production

Eyetunes est une co-production [acces)s( cultures électroniques](http://acces-s.org/), [le Bel Ordinaire](http://belordinaire.agglo-pau.fr/) et la [Maison des éditions](http://maisondeseditions.fr/).

## Informations

[maisondeseditions.fr/eyetunes/](http://maisondeseditions.fr/eyetunes/)

## Client

Ce dépôt héberge le code serveur (table tactile), et permet d’écouter les données OSC/tuio transmises par [CCV](http://ccv.nuigroup.com/) ou [TSPS](http://www.tsps.cc/) pour les transmettre à l’application node. Les commandes d’ajout à la playlist sont transmises via websockets à l'application cliente eyetunes-client.

## Mise en route

```
mkdir -p ~/Codo/node/ && cd ~/Codo/node/
git clone git@github.com:jbidoret/eyetunes-server.git 
cd eyetunes-server
npm install
node server.js
```

L’application est accessible sur http://127.0.0.1:5000