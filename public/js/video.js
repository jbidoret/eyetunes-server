
$(function(){

	var $video_container = $('#video_container'),
		$mevideo = $('#mevideo'),
		$title = $('#title'),
		$wait = $('#wait'),
		$body = $('body'),
		current_playlist = [],
		videos = document.videos,
		meVideo,
		title_duration = 4000,
		first_load=true,
		waitmode=true,
		//socket = io.connect('http://172.17.200.102:5000');
		socket = io.connect('http://127.0.0.1:5000');


	// ribbon
	var ribboninterval,
		triangleinterval,
		c = document.getElementById('ribbon'), 
        a = c.getContext('2d'), 
        w = c.width = window.innerWidth, 
        h = c.height = window.innerHeight, 
        //max fluctuation
        fluctuation = h / 4,
        q, 
        r = 66;
    
    a.globalAlpha = 1;


    // socket magic
	socket.on('added', function(id){
		//console.log('added video #' + id + ' (')
		console.log('added video #' + id + ' (' + videos[parseInt(id-1)].title + ')')
		// supprime le ruban
		ribbon.destroy();
		// ajoute l’id reçu via socket dans la playlist
		current_playlist.push(id);
		// s’il n’y a pas de vidéo en cours, charge la vidéo reçue
		if(current_playlist.length==1) {
			vid.loadNextVideo();
			title.showNextTitle();
		}			

	    
	});

	/* -----------------------------------------------------------------------------------------
	Hide cursro
	------------------------------------------------------------------------------------------*/
	var mouse = {
		init: function(){
			
			$body.on('mousemove', function(){
				$body.removeClass('nomouse')
				clearTimeout(nomousetimeout);
				mouse.initTimeout();
			})
		},
		initTimeout:function(){
			nomousetimeout = setTimeout(function(){
				$body.addClass('nomouse');
			}, 4000) // 4 sec
		}

	}

	// init nomouse
	mouse.init();
	mouse.initTimeout();


	/* -----------------------------------------------------------------------------------------
	Gestion des <video>
	------------------------------------------------------------------------------------------*/

	var vid = {

		// initialisation de Mediaelement
		init: function(){
			meVideo = new MediaElement('mevideo', {
			    enablePluginDebug: false,
			    type: 'video/mp4',
			    pluginWidth: -1,
			    pluginHeight: -1,
			    videoWidth: -1,
			    videoHeight: -1,
			    
			    success: function (mediaElement, domObject) {
			         
			        // en fin de vidéo, supprime la vignette de la playlist affiché côté table
			        mediaElement.addEventListener('ended', function(e) {
			        	// masque le player
			        	$video_container.removeClass('visible');
			        	// désannonce
			            title.showPrevTitle();
			        	// supprime le premier élément de la playlist
			            current_playlist = current_playlist.slice(1);

			        	// socket emit
			            socket.emit('remove', 0);
			            
			            // envoie la vidéo suivante (s’il y en a une)
		            	if(current_playlist.length > 0){		
							vid.loadNextVideo();	
						} else {
							var s = setTimeout(ribbon.init, 2000)
						}
		            	

			        }, false);
			         
			    },
			})				
		},

		// charge la video dans le player
		loadNextVideo : function(){
			var next_video = current_playlist[0];			
			mevideo.setSrc( 'http://localhost:4444/public/video/' + next_video + '.mp4');
		}
	}

	


	/* -----------------------------------------------------------------------------------------
	Fonctions d’affichage des cartons entre les vidéos
	------------------------------------------------------------------------------------------*/ 

	var title = {
		// affiche d’abord le titre de la vidéo précédente (s’il y a une vidéo précédente)
		showTitle:function(){
			if (first_load == true){
				title.showNextTitle();
				first_load=false;
			} else {
				title.showPrevTitle()
			}			
		},

		// affiche le précédent titre, et appelle l’affichage du suivant
		showPrevTitle:function(){
			title.setText(current_playlist[0], true)
			$title
				.addClass('visible')
				.wait(title_duration)
				.removeClass('visible')
				.wait(2000)
				.each(function(){ 
					if(current_playlist.length > 0){	
						title.showNextTitle();
					}
				})
		},

		// charge la video suivante, affiche son titre, joue la vidéo
		showNextTitle:function(){
			title.setText(current_playlist[0], false)
			

			$title
				.addClass('visible')
				.wait(title_duration)
				.wait(2000)
				.removeClass('visible')
				.each(function(){ 
					$video_container.addClass('visible')
					mevideo.play()
				})
				
		},

		// utilitaire pour créer le carton titre d’une vidéo à partir de son id
		setText:function(id, end){
			var video_info = videos[parseInt(id - 1)];

			// pour les titres affichés après la video (désannonce)
			if (end==true) $title.addClass('theend')
			else  $title.removeClass('theend')
			
			for(var key in video_info){
				if (video_info.hasOwnProperty(key)) {
				    $title.find('.' + key).html(video_info[key]);				    
			  	}
			}
		}

		
	}


	// funky ribbon
	var ribbon = {

		init:function(){

			$wait.show();
			waitmode=true;
			var s = setTimeout(function(){
				ribboninterval = setInterval(ribbon.drawRibbon, 6000);	
			}, 2000)	    
            
        },

        drawRibbon:function(){
        	a.clearRect(0, 0, w, h);
            //init 2 starting points
            q = [{
                x : 0,
                y : h / 2 + fluctuation
            }, {
                x : 0,
                y : h / 2 - fluctuation
            }];
            //draw triangles until we reach the other end of the screen
            clearInterval(triangleinterval);
            triangleinterval = setInterval(function(){
            	if(q[1].x < w + 12) {            	
	                ribbon.draw(q[0], q[1]);
	            };
            }, 25)
        },

        draw: function (i, j) {
            a.beginPath();
            var x = i.x// < j.x ? i.x - 1 : i.x + 1;
            var y = i.y// < j.y ? i.y - 1 : i.y + 1;
            a.moveTo(x, y);
            a.lineTo(j.x, j.y);
            //get the x and y of a random third point to draw a triangle
            var newX = j.x + (Math.random() * 2 - 0.5) * fluctuation
            var newY = ribbon.target(j.y);
            
            a.lineTo(newX, newY);
            a.closePath();
            
            //shift color radius by a small amount
            r -= Math.PI * 2 / -25;
            var fillStyle = '#' + (Math.cos(r) * 100 + 128 << 16 | Math.cos(r + Math.PI * 2 / 3) * 100 + 128 << 8 | Math.cos(r + Math.PI * 2 / 3 * 2) * 100 + 128).toString(16);
            
            a.fillStyle = a.strokeStyle = fillStyle;
            a.fill();
            a.stroke();
            
            //shuffle points
            q[0] = q[1];
            q[1] = {
                x : newX,
                y : newY
            };
        },

        target: function(p) {
            var t = p + (Math.random() * 2 - 1) * fluctuation;
            //recursively get a target y within the window
            return (t > h || t < 0) ? ribbon.target(p) : t;
        },

        destroy:function(){
        	waitmode=false;
        	$wait.hide()
        	clearInterval(triangleinterval);
        	clearInterval(ribboninterval);
        }

	}

	vid.init();
	ribbon.init()
	
})