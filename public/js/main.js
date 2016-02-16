$(function(){

	var $videos_container = $('#videos_container'),
		$videoThumbs,
		$page = $('#page'),
		$close = $('#close'),
		$playlist = $('#playlist'),
		$swiper = $('#swiper'),
		$tpl = $('#tpl'),
		$add = $('#add'),
		$body = $('body'),
		$message = $('#message'),
		$overlay = $('#overlay'),
		current_playlist = [],
		swiper,
		videos = document.videos,
		blinktimeout,
		blinktimeouts = [],
		blinks = [],
		nomouse = false,
		nomousetimeout,
		//socket = io.connect('http://172.17.200.102:5000');
		socket = io.connect('http://127.0.0.1:5000');

	var maxVideosInPlaylist = 5;

	/* -----------------------------------------------------------------------------------------
	Socket.io 
	------------------------------------------------------------------------------------------*/

	// reçoit un signal de fin de la part du diffuseur des vidéos

	socket.on('remove', function(id){
		//console.log('try to remove '+ id + ' from current_playlist');
		if(current_playlist.length>0){
			current_playlist = current_playlist.slice(1);
			$playlist.find('.item').first().remove()			
			//console.log('removed '+ id + ' from current_playlist which becomes :')
			//console.log(current_playlist)
		} 
	});

	/* -----------------------------------------------------------------------------------------
	Initialisation massive
	------------------------------------------------------------------------------------------*/
	var base = {
		init: function(){



			for (var i = 0; i < videos.length; i++) {

				// Crée une grille des vidéos 
				var video = videos[i];
				var $video = $('<div class="video" data-id="' + video.id + '"><div class="bg-video" id="bg-' + video.id + '" style="background-image:url(/public/img/'+ video.id +'/JPEG/t.jpg);"></div></div>');
				
				$videos_container.append($video);

				// créée les pages de détail, en clonant un template vide issu de l’index.html
				var $tplclone = $tpl.clone();
				$tplclone.attr('id', 'tpl-'+video.id)
					.addClass('swiper-slide')
					.css('display', 'block');
				// ajoute ces pages au slider touchable / swipable
				$swiper.append($tplclone);

				// populate data à partir du dictionnaire json issu de data.js (document.videos)
				for(var key in video){
					if (video.hasOwnProperty(key)) {
					    $tplclone.find('.' + key).html(video[key]);				    
				  	}
				}

				$videoThumbs = $('.bg-video');

				// crées les 7 images affichables dans le template
				for (var j = 1; j < 8; j++) {
					var $img = $('<div><img class="img" src="/public/img/'+ video.id + '/JPEG/' + j + '.jpg"></div>');
					$tplclone.find('.images').append($img);
				};
			};

			// init swiper
			swipe.init();

			// init playlist
			playlist.init();

			// init pages
			pages.init();

			// init blink
			blink.init();

			// init nomouse
			mouse.init();
			mouse.initTimeout();

		}
	}

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
	            clck.Klik(ev.originalEvent.clientX, ev.originalEvent.clientY)
	        })
	        .bind("swipe", function(ev) {
	            if($page.hasClass('visible')){
	            	if(ev.direction=='right'){
	            		swiper.slidePrev()
	            	} else {
	            		swiper.slideNext()
	            	}
	            }
	        });

			$('body').on('click', function(e){
				clck.Klik(e.pageX, e.pageY)				
			})			
		},
		Klik: function(x, y){
			blink.resetTimeout();
			var $circle = $('<div class="circle"><span></span><span></span></div>');
			$circle.css({
				'left':x,
				'top':y
			})
			$('body').append($circle);
			$circle.addClass('visible');
			var s = setTimeout(function() {
				$circle.removeClass('visible').wait(1000).remove()
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
				var randnb = Math.floor(Math.random() * $videoThumbs.length) + 1;
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
			$close.hammer({
	            prevent_default: false,
	            drag_vertical: false
	        })
	        .bind("touch hold tap doubletap click", function(){
				pages.hidePage();
				messages.hide();
			});

			$('.video').hammer({
	            prevent_default: false,
	            drag_vertical: false
	        })
	        .bind("touch hold tap doubletap click", function(ev) {
	            pages.showPage($(this).attr("data-id"))
	        })
		},
		
		showPage: function(id){
			swiper.slideTo(id, 0);
			setTimeout(function(){
				$page.addClass('visible');	
			},50)
		},

		hidePage: function(){
			$page.removeClass('visible');			
		}
	}


	/* -----------------------------------------------------------------------------------------
	Gestion de la playlist
	------------------------------------------------------------------------------------------*/

	var playlist = {
		init: function(){

			// ajout d’une vidéo à la playlist
			$add.hammer({
	            prevent_default: false,
	            drag_vertical: false
	        })
	        .bind('touch hold tap doubletap click', function(){
				var this_video = $(this).attr('data-video');

				// cas d’ajout impossible
				var toomuch = current_playlist.length >= maxVideosInPlaylist;
				var alreadyinplaylist = $.inArray(this_video, current_playlist) != -1;

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
					$(this).addClass('nope');
					var s = setTimeout(function(){
						$add.removeClass('nope')
					}, 550)
				} 
				// ajout possible
				else {
					console.log('added video #' + this_video + '(' + videos[parseInt(this_video - 1)].title)
					playlist.addVideo(this_video)
					
				}
			})
		},
		// utilitaire de transmission de l’id en provenance de la page de détail affichée 
		// vers le bouton d’ajout à la playlist
		setAddButton : function(id){
			$add.attr('data-video', id);
		},

		// ajout effectif d’une vidéo à la playlist
		addVideo: function(id){
			current_playlist.push(id);
			pages.hidePage();
			playlist.createItem(id)
			// socket.io envoie l’info au diffuseur
			socket.emit('added', id);
		},
		
		// création d’un élément dans la playlist
		createItem: function(id){
			//console.log('Try to createItem ' + id)
			var video = videos[parseInt(id - 1)];
			if($playlist.children().length < maxVideosInPlaylist + 1){
				var $item = $('<div class="item video" data-id="'+ video.id +'"><div style="background-image:url(/public/img/'+ video.id +'/JPEG/t.jpg)"></div></div>');
				$playlist.append($item);
				//console.log('Playlist item created')
				var s = setTimeout(function(){
					$item.addClass('visible');
				}, 50)
			}
			// réinitialisation des pages pour asocier l’événement click à la vignette de la vidéo dans la playlist
			pages.init();
			
		},

		// suppression d’un élément de la playlist
		removeVideo: function(index){
			if(!index) index = 0;
			$playlist.eq(index + 1).remove()
		}

	}



	/* -----------------------------------------------------------------------------------------
	Gestion du slider : dépendant de idangerous swiper
	------------------------------------------------------------------------------------------*/
	
	var swipe = {
		init: function(id){
			swiper = new Swiper('.swiper-container', {
		        nextButton: '#next',
		        prevButton: '#prev',
		        spaceBetween: 30,
		        touchRatio:2,
		        touchAngle:10,
		        loop: true,
		        onSlideChangeEnd:function(swiper){
		        	playlist.setAddButton(swiper.activeIndex)
		        }
		    });

		    $('#next, #prev').hammer({
	            prevent_default: false,
	            drag_vertical: false
	        })
	        .bind("touch hold tap doubletap click", function(ev) {
	            $(this).trigger('click')
	        });
		}

	}


	/* -----------------------------------------------------------------------------------------
	Initialisation
	------------------------------------------------------------------------------------------*/
	
	base.init();
	clck.init();
	
})