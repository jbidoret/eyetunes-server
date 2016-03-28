var wheight, wwidth, avoidDoubleEvent = false;



$(function(){

    var $body = $('body'),
        $list = $('#list'),
        rowmodulo=0,
        videos = document.videos,
        wheight = $(window).height(),
        wwidth = $(window).width();

    var colheight = colwidth = 100/6;

   
    /* -----------------------------------------------------------------------------------------
    Initialisation massive
    ------------------------------------------------------------------------------------------*/
    var base = {
        init: function(){

            
            for (var i = 0; i < videos.length; i++) {

                //////////////////////////////// GRILLE DES VIDÉOS
                //////////////////////////////////////////////////

                // Crée une grille des vidéos 
                var video = videos[i];
                


                /////////////////////////////////// PAGE DE DÉTAIL
                //////////////////////////////////////////////////

                // créée les pages de détail, en clonant un template vide issu de l’index.html
                var $page = $('#tpl').clone();
                $page.attr('id', 'list-page-'+video.id)
                    .data('id', video.id)
                    .css('display', 'block');
                
                // intègre les données à partir du dictionnaire json issu de data.js (document.videos)
                for(var key in video){
                    if (video.hasOwnProperty(key)) {
                        $page.find('.' + key).html(video[key]);       
                        if(key == "url") { 
                            $page.find('.' + key).attr('href', 'http://' + video[key] );
                        }
                    }
                }

                var $innergrid = $page.find('.listgrid');

                // crées les 7 images affichables dans le template
                for (var j = 1; j <= 8; j++) {
                    var className = "";
                    
                    if(j==1) {
                        className = "huge size3 img";
                    } else if(j == 2) {
                        className = "size2 img";
                    } else {
                        className = "size1 img";
                    }
                    var $img = $('<div class="griditem gridimage '+ className + j + '" style="background-image:url(/public/img/'+ video.id + '/JPEG/' + j + '.jpg)"></div>');
                    $img.append($('<span class="imageid">' + j + '</span>'));
                    $innergrid.append($img);
                };

                if (video.hasOwnProperty('positions')) {
                    var positions = video.positions;
                    for(var key in positions){
                        if (positions.hasOwnProperty(key)) {
                            
                            $page.find('.' + key).css({
                                'left': positions[key][0] * colwidth + '%', 
                                'top': positions[key][1] * colheight + '%'
                            }).append($('<span class="layouthelper">' +positions[key][0] + ',' + positions[key][1] + '</span>'));

                            // si un troisième paramètre est passé : special size
                            if(positions[key].length > 2){
                                console.log($page.find('.' + key))
                                $page.find('.' + key).attr('size', 'size'+positions[key][2]);
                            }

                        }
                    }
                }       

                $list.append($page);
                
            };


            // Yo. I haz videos initialized

        }
    }


    



    /* -----------------------------------------------------------------------------------------
    Initialisation
    ------------------------------------------------------------------------------------------*/
    
    base.init();
    
})