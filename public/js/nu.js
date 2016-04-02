var wheight, wwidth, avoidDoubleEvent = false;
var timeouts = [];

transitionDuration = 800


jQuery.fn.reverse = [].reverse;


$.Velocity.RegisterEffect("goUp", {
    defaultDuration: "250",
    calls: [
        [ { translateY: function(){
        	var t = 0 - (800 + Math.round(Math.random()* 800));
        	// console.log('goUP calls: ' + t);
        	return t;
        } }, 1, {  } ]
    ]
});

$.Velocity.RegisterEffect("goDown", {
    defaultDuration: "250",
    calls: [
        [ { translateY: 0 }, 1, { backwards:true } ]
    ],
    backwards:true
});



$(function(){

	var $body = $('body'),

		$playlist = $('#playlist'),

		$grid = $('#grid'),
		
		$currentPage,

		$message = $('#message'),
		$overlay = $('#overlay'),
		current_playlist = [],
		
		videos = document.videos,
		blinktimeout,
		blinktimeouts = [],
		blinks = [],
		wheight = $(window).height(),
		wwidth = $(window).width(),
		rowmodulo=0,
		nomouse = false,
		nomousetimeout,
		//socket = io.connect('http://172.17.200.102:5000');
		socket = io.connect('http://127.0.0.1:5000');

	var maxVideosInPlaylist = 6;

	var colheight = colwidth = 100/6;
	var $rankplaying;

	/* -----------------------------------------------------------------------------------------
	Socket.io 
	------------------------------------------------------------------------------------------*/

	// reçoit un signal de fin de la part du diffuseur des vidéos

	socket.on('remove', function(id){
		//console.log('try to remove '+ id + ' from current_playlist');
		if(current_playlist.length>0){
			current_playlist = current_playlist.slice(1);

			playlist.enumerate();
			//$playlist.find('.item').first().remove()			
			console.log('removed '+ id + ' from current_playlist which becomes :')
			console.log(current_playlist)
		} 
	});

	// socket magic
	socket.on('playing', function(id){
		console.log('yeah U has playing')
		console.log('playing current_playlist[' + id + ']')
		
	});

	socket.on('timeupdate', function(time){
		if($rankplaying !== undefined){
			if(time != 0){
				$rankplaying.text(time);

			} else {
				$rankplaying.text('…')
			}
		}
		
	});

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
				var $video = $('<div class="video" data-id="' + video.id + '" id="video-' + video.id + '"><div class="bg-video" id="bg-' + video.id + '" style="background-image:url(/public/img/'+ video.id +'/JPEG/t.jpg);"><span class="rank"><span class="playing"></span></span></div></div>');
				// grid modulooo !
				if(i!= 0 && i % 6 == 0) rowmodulo++;
				// append
				$grid.append($video);
				// position
				$video.css({
					"top": rowmodulo * colheight + "%" ,
					"left":  (i % 6) * colwidth + "%",
					'position': 'absolute'
				})

				/////////////////////////////////// PAGE DE DÉTAIL
				//////////////////////////////////////////////////

				// créée les pages de détail, en clonant un template vide issu de l’index.html
				var $page = $('#tpl').clone();
				$page.attr('id', 'page-'+video.id)
					.data('id', video.id)
					.css('display', 'block');
				
				// intègre les données à partir du dictionnaire json issu de data.js (document.videos)
				for(var key in video){
					if (video.hasOwnProperty(key)) {
					    $page.find('.' + key).html(video[key]);				    
				  	}
				}

				var $innergrid = $page.find('.grid');

				// crées les 7 images affichables dans le template
				for (var j = 1; j <= 8; j++) {
					var className = "";
					
					if(j==1) {
						className = "huge size3 play img";
					} else if(j == 2) {
						className = "size2 img";
					} else {
						className = "size1 img";
					}
					var $img = $('<div class="griditem gridimage '+ className + j + '" style="background-image:url(/public/img/'+ video.id + '/JPEG/' + j + '.jpg)"></div>');
					$img.append($('<span class="imageid">' + j + '</span>'));
					if(j==1) {
						$img.append($('<span class="clickmetoplay"></span>'));
					}
					$innergrid.append($img);
				};


				// positionne les éléments de la page sur la grille de mise en page
				// le layout est défini en {colonne,ligne} dans data-layout.js
				
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
						    var top = wheight + Math.round(Math.random()* wheight/2);

						    // initiate velocity on items
							$page.find('.' + key).velocity({
								translateY: top + "px"
							}, { duration: 0 });
					  	}
					}
				}		

				$grid.append($page);
				
			};


			// Yo. I haz videos initialized
			// So, now: 
			

			// initialize playlist
			playlist.init();

			// initialize pages and navigation
			pages.init();
			pages.initAllNavEvents();

			// initialize blink mode
			blink.init();

			// initialize nomouse mode
			mouse.init();
			mouse.initTimeout();

		}
	}


	/* -----------------------------------------------------------------------------------------
	Mouse listener
	Add / remove CSS class : body.nomouse, body.nomouse * {cursor: none;}
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
			}, 400) // 4 sec
		}

	}



	/* -----------------------------------------------------------------------------------------
	Feedback utilisateur pour rendre le tap visible
	Annule le mode blink blink
	------------------------------------------------------------------------------------------*/
	var clck = {
		init:function(){
			$("body").hammer({
	            prevent_default: false,
	            drag_vertical: false
	        })
	        .bind("touch hold tap doubletap", function(ev) {
	        	console.log('clck:' + ev.originalEvent.clientX + ',' + ev.originalEvent.clientY)
	        	if(ev.originalEvent.clientX==null || ev.originalEvent.clientY==null){
	        		return false;	
	        	} 
	            clck.Klik(ev.originalEvent.clientX, ev.originalEvent.clientY)
	        })
	        .bind("swipe", function(ev) {	            
            	if(ev.direction=='right'){
            		pages.slideToPrev()
            	} else if(ev.direction=='left') {
            		pages.slideToNext()
            	} else if(ev.direction='up'){
            		pages.slideToGrid()
            	}	            
	        });

	        // mouse mode : )
			$('body').on('click', function(e){
				clck.Klik(e.pageX, e.pageY)				
			})			
		},

		Klik: function(x, y){
			blink.resetTimeout();
			var $circle = $('#circle');
			$circle.addClass('visible');
			$circle.css({
				'left':x>0 ? x : "-200px",
				'top':y>0 ? y : "-200px"
			})
			var s = setTimeout(function() {
				$circle.removeClass('visible');
			}, 500)
		}
	}

	/* -----------------------------------------------------------------------------------------
	Fais clignoter l’interface pour appeler l’utilisateur
	------------------------------------------------------------------------------------------*/
	var blink = {
		init:function(){
			blink.startTimeout();
		},

		startTimeout:function(){
			blinktimeout = setTimeout(function(){
				blink.makeBlinkLoop()
			}, 2 * 60 * 1000) // 2 minutes
		},

		resetTimeout: function(){
			clearTimeout(blinktimeout);
			for (var i = 0; i < blinks.length; i++) {
				clearInterval(blinks[i])
			};
			for (var i = 0; i < blinktimeouts.length; i++) {
				clearTimeout(blinktimeouts[i])
			};
			blink.init();
		},

		makeBlinkLoop: function(){
			
			blink.makeBlink();
		    var rand = Math.round(Math.random() * (3000 - 500)) + 5000;
		    var s = setTimeout(blink.makeBlinkLoop, rand);
		    blinktimeouts.push(s)
			
		},

		makeBlink: function(){
			if (current_playlist.length == 0) {
				var randnb = Math.floor(Math.random() * videos.length) + 1;
			    var $whichVideo = $('#bg-' + randnb);
			    
			    $whichVideo.addClass('blink')

				var i = setInterval(function(){
					var randpic = '/public/img/' + randnb + '/JPEG/' + parseInt(Math.floor(Math.random() * 8) + 1) + '.jpg';
					$whichVideo.css('background-image', 'url('+randpic +')' );
				}, 150)
				blinks.push(i);
			};
		}
	}

	/* -----------------------------------------------------------------------------------------
	Gestion des messages associés à l’ajout des vidéos en cas de
	- vidéo déjà dans la playlist
	- playlist pleine
	------------------------------------------------------------------------------------------*/
	var messages = {
		show: function(message, mtype){
			$overlay.addClass('visible')
			$message.html(message).addClass('visible');
			var s = setTimeout(function(){
				messages.hide();
			}, 3000)
		},
		hide: function(){
			$message.removeClass('visible');
			$overlay.removeClass('visible');
			//$message.empty();
		}
	}

	/* -----------------------------------------------------------------------------------------
	Gestion de |'affichage des pages de détail des vidéos
	------------------------------------------------------------------------------------------*/
	var pages = {

		init:function(){

			// init touch events on video thumbnails
			$('.video').hammer({
	            prevent_default: false,
	            drag_vertical: false
	        })
	        .bind("touch hold tap doubletap click", function(ev) {

	        	if(ev.originalEvent.clientX != null && ev.originalEvent.clientY != null && avoidDoubleEvent == false){
		        	
		        	console.log('hammered .video');
	        		avoidDoubleEvent = true;
	        		var s = setTimeout(function(){
	        			avoidDoubleEvent = false;
	        		}, 250)
	        		// slide to page
	        		pages.slideToPage($(this).attr("data-id"))	
		        	
		        }
	            
	        })
		},

		
		// init nav events on each page
		initAllNavEvents:function(){
			
			$('.next').hammer({
	            prevent_default: false,
	            drag_vertical: false
	        }).bind("touch hold tap doubletap click", function(ev) {
	        	if(ev.originalEvent.clientX != null && ev.originalEvent.clientY != null && avoidDoubleEvent == false) {
	        		avoidDoubleEvent = true;
	        		var s = setTimeout(function(){
	        			avoidDoubleEvent = false;
	        		}, 250)
	        		pages.slideToNext();	          
	        	}
	        })

	        $('.prev').hammer({
	            prevent_default: false,
	            drag_vertical: false
	        }).bind("touch hold tap doubletap click", function(ev) {
	           if(ev.originalEvent.clientX != null && ev.originalEvent.clientY != null && avoidDoubleEvent == false) {
	           		avoidDoubleEvent = true;
	        		var s = setTimeout(function(){
	        			avoidDoubleEvent = false;
	        		}, 250)
	           		pages.slideToPrev();
	            }
	        })

	        $('.back').hammer({
	            prevent_default: false,
	            drag_vertical: false
	        }).bind("touch hold tap doubletap click", function(ev) {
	           	if(ev.originalEvent.clientX != null && ev.originalEvent.clientY != null && avoidDoubleEvent == false) {
	           		avoidDoubleEvent = true;
	        		var s = setTimeout(function(){
	        			avoidDoubleEvent = false;
	        		}, 250)
	           		pages.slideToGrid();
	           	}
	        })

	        $('.clickmetoplay').hammer({
	            prevent_default: false,
	            drag_vertical: false
	        }).bind("touch hold tap doubletap click", function(ev) {
	        	if(ev.originalEvent.clientX != null && ev.originalEvent.clientY != null && avoidDoubleEvent == false) {
	        		avoidDoubleEvent = true;
	        		var s = setTimeout(function(){
	        			avoidDoubleEvent = false;
	        		}, 250)
	        		playlist.addVideo();
	        	}
	        })

		},

		

		slideToNext:function(){
			var currentId = $currentPage.data('id'),
				nextId;
			if(currentId == videos.length){
				nextId = 1;
			} else { 
				nextId = currentId + 1;
			}
			var $nextPage = $('#page-'+nextId);

			$currentPage.find('.griditem').each(function(){
				var left = 0 - (wwidth + Math.round(Math.random()* wwidth));
				$(this).velocity({
					translateX: left + "px"
				}, { duration: transitionDuration });
			})


			$nextPage.find('.griditem').each(function(){
				var left = wwidth + Math.round(Math.random()* wwidth);
				$(this).velocity({
					translateX: left + "px",
					translateY:0
				}, { duration: 0 });

				$(this).velocity({
					translateX: "0px"
				}, { duration: transitionDuration });
			})

			$currentPage = $nextPage;

			pages.setPageStatus(currentId);

		},

		

		slideToPrev:function(){
			var currentId = $currentPage.data('id'),
				prevId;
			if(currentId == 1){
				prevId = 36;
			} else { 
				prevId = currentId - 1;
			}
			var $nextPage = $('#page-'+prevId);

			$currentPage.find('.griditem').each(function(){
				var right = wwidth + Math.round(Math.random()* wwidth);
				$(this).velocity({
					translateX: right + "px"
				}, { duration: transitionDuration });
			})


			$nextPage.find('.griditem').each(function(){
				var left = 0 - (wwidth + Math.round(Math.random()* wwidth));
				$(this).velocity({
					translateX: left + "px",
					translateY:0
				}, { duration: 0 });

				$(this).velocity({
					translateX: "0px"
				}, { duration: transitionDuration });
			})

			$currentPage = $nextPage;
			pages.setPageStatus(currentId);
		},


		slideToGrid:function(){

			$('.video').reverse().each(function(i){
				$(this).delay((i++) * 10).velocity("goDown", { 
					duration: transitionDuration,					
				})
			})

		    // initiate velocity on items
			$currentPage.find('.griditem').each(function(){
				var top = wheight + Math.round(Math.random()* wheight/2);
				$(this).velocity({
					translateY: top + "px"
				}, { duration: transitionDuration });
			})

			var s = setTimeout(function(){ 
				// top + important que la hauteur de la fenêtre pour tous les griditems
				var top = wheight + Math.round(Math.random()* wheight/2);
				$('.griditem').velocity({
					translateX: 0,
					translateY: top + "px"
				}, { duration: 0 });
			},transitionDuration + 1000)
				
		},

		slideToPage: function(id){
			console.log('slideToPage: ' + id)

			pages.setPageStatus(id);

			$('.video').each(function(i){
				$(this).delay((i++) * 10).velocity("goUp", { 
					duration: transitionDuration
				})
			})

			// top + important que la hauteur de la fenêtre pour tous les griditems
			var top = wheight + Math.round(Math.random()* wheight/2);
			$('.griditem').velocity({
				translateX: 0,
				translateY: top + "px"
			}, { duration: 0 });

			// page à afficher
			var $page = $('#page-' + id);
			$page.find('.griditem').each(function(){
				$(this).velocity({
					translateY: "0px"
				}, { duration: transitionDuration });
				
			})
			$currentPage = $page;
			

		},
		
		setPageStatus:function(currentId){
			var $page = $('#page-' + currentId);

			if(current_playlist[0] == currentId){
				$('.img1').removeClass('playing');
				$page.find('.img1').addClass('playing');
			} 
		}
	}


	/* -----------------------------------------------------------------------------------------
	Gestion de la playlist
	------------------------------------------------------------------------------------------*/

	var playlist = {
		init: function(){

			
		},
		

		// ajout effectif d’une vidéo à la playlist
		addVideo: function(){

			var current_video_id = $currentPage.data('id');

			

			// cas d’ajout impossible
			var toomuch = current_playlist.length >= maxVideosInPlaylist;
			var alreadyinplaylist = $.inArray(current_video_id, current_playlist) != -1;

			// ajout impossible
			if(alreadyinplaylist || toomuch){
				// affichage des messages d’erreur
				if (toomuch) {
					messages.show('Trop d’éléments dans la playlist. Asseyez-vous, écoutez et regardez avant d’ajouter cette vidéo.')
				}
				if (alreadyinplaylist) {
					messages.show('Cette vidéo est déjà dans la playlist.')
				}
				// feed back sur le bouton
				$currentPage.find('.add').addClass('nope');
				var s = setTimeout(function(){
					$currentPage.find('.add').removeClass('nope')
				}, 550)
			} 
			// ajout possible
			else {
				console.log('added video #' + current_video_id + '(' + videos[parseInt(current_video_id - 1)].title)
				
				current_playlist.push(current_video_id);
				pages.slideToGrid();
				playlist.enumerate();

				// socket.io envoie l’info au diffuseur
				socket.emit('added', current_video_id);
			}


			
		},

		enumerate: function(){
			$('.rank').empty('').removeClass('waitaminuteplease');
			$('.video').removeClass('playing');
			
			for (var i = 0; i < current_playlist.length; i++) {
				var $whichitem = $('.video[data-id='+ current_playlist[i] +']');
				if(i==0){
					$whichitem.addClass('playing');
					$rankplaying = $whichitem.find('.rank');
					$whichitem.find('.rank').addClass('waitaminuteplease').text('…');
				} else{
					$whichitem.find('.rank').text("#" + parseInt(i + 1));	
				}
				
			}
		},
		
		// suppression d’un élément de la playlist
		removeVideo: function(index){
			if(!index) index = 0;
			$playlist.eq(index + 1).remove()
		}

	}




	/* -----------------------------------------------------------------------------------------
	Initialisation
	------------------------------------------------------------------------------------------*/
	
	base.init();
	clck.init();
	
})