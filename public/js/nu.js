var wheight, wwidth, avoidDoubleEvent = false;
var timeouts = [];

transitionDuration = 800


jQuery.fn.reverse = [].reverse;


$.Velocity.RegisterEffect("goUp", {
    defaultDuration: "250",
    calls: [
        [ { translateY: function(){
        	var t = 0 - (800 + Math.round(Math.random()* 800));
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

	var $currentTpl,
		$page = $('#page'),
		$close = $('.back'),
		$playlist = $('#playlist'),

		$grid = $('#grid'),
		
		$content = $('#content'),
		$tpl = $('#tpl'),
		$add = $('#add'),
		$body = $('body'),
		$message = $('#message'),
		$overlay = $('#overlay'),
		current_playlist = [],
		
		videos = document.videos,
		blinktimeout,
		blinktimeouts = [],
		blinks = [],
		wheight = $(window).height(),
		wwidth = $(window).width(),
		collllll=0,
		nomouse = false,
		nomousetimeout,
		//socket = io.connect('http://172.17.200.102:5000');
		socket = io.connect('http://127.0.0.1:5000');

	var maxVideosInPlaylist = 5;

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

				// Crée une grille des vidéos 
				var video = videos[i];
				var $video = $('<div class="video" data-id="' + video.id + '" id="video-' + video.id + '"><div class="bg-video" id="bg-' + video.id + '" style="background-image:url(/public/img/'+ video.id +'/JPEG/t.jpg);"><span class="rank"><span class="playing"></span></span></div></div>');
				// grid modulooo !
				if(i!= 0 && i % 6 == 0) collllll++;
				// append
				$grid.append($video);
				// position
				$video.css({
					"top": collllll * colheight + "%" ,
					"left":  (i % 6) * colwidth + "%",
					'position': 'absolute'
				})

				// créée les pages de détail, en clonant un template vide issu de l’index.html
				var $tplclone = $tpl.clone();
				$tplclone.attr('id', 'tpl-'+video.id)
					.data('id', video.id)
					.css('display', 'block');

				// ajoute ces pages
				
				
				// populate data à partir du dictionnaire json issu de data.js (document.videos)
				for(var key in video){
					if (video.hasOwnProperty(key)) {
					    $tplclone.find('.' + key).html(video[key]);				    
				  	}
				}

				var $innergrid = $tplclone.find('.grid');

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


				// position les éléments de la page sur la grille de mise en page
				// le layout est défini en {colonne,ligne} dans data-layout.js
				
				if (video.hasOwnProperty('positions')) {
					var positions = video.positions;
					for(var key in positions){
						if (positions.hasOwnProperty(key)) {
							
						    $tplclone.find('.' + key).css({
						    	'left': positions[key][0] * colwidth + '%', 
						    	'top': positions[key][1] * colheight + '%'
						    }).append($('<span class="layouthelper">' +positions[key][0] + ',' + positions[key][1] + '</span>'));

						    // si un troisième paramètre est passé : special size
						    if(positions[key].length > 2){
						    	console.log($tplclone.find('.' + key))
						    	$tplclone.find('.' + key).attr('size', 'size'+positions[key][2]);
						    }
						    var top = wheight + Math.round(Math.random()* wheight/2);

						    // initiate velocity on items
							$tplclone.find('.' + key).velocity({
								translateY: top + "px"
							}, { duration: 0 });
					  	}
					}
				}		


				$grid.append($tplclone);
				
				pages.initNavEvents($tplclone);		
			};

			

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


	/* -----------------------------------------------------------------------------------------
	Mouse listener
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
	            		pages.slideToPrev()
	            	} else if(ev.direction=='left') {
	            		pages.slideToNext()
	            	} else if(ev.direction='up'){
	            		pages.slideToGrid()
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
				'left':x>0 ? x : "-200px",
				'top':y>0 ? y : "-200px"
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
	        	// avoid event to be triggered twice
	        	if(avoidDoubleEvent == false){
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
		initNavEvents:function($tpl){
			
			$tpl.find('.next').bind("touch hold tap doubletap click", function(ev) {
	            pages.slideToNext();	          
	        })
	        $tpl.find('.prev').bind("touch hold tap doubletap click", function(ev) {
	            pages.slideToPrev();
	        })
	        $tpl.find('.back').bind("touch hold tap doubletap click", function(ev) {
	            pages.slideToGrid();
	        })
	        $tpl.find('.huge').bind("touch hold tap doubletap click", function(ev) {
	        	playlist.addVideo();
	        })
		},

		slideToGrid:function(){

			$('#grid .video').reverse().each(function(i){
				$(this).delay((i++) * 10).velocity("goDown", { 
					duration: transitionDuration,
					
				})
			})

		    // initiate velocity on items
			$currentTpl.find('.griditem').each(function(){
				var top = wheight + Math.round(Math.random()* wheight/2);
				$(this).velocity({
					translateY: top + "px"
				}, { duration: transitionDuration });
			})
				
		},

		slideToNext:function(){
			var currentId = $currentTpl.data('id'),
				nextId;
			if(currentId == videos.length){
				nextId = 1;
			} else { 
				nextId = currentId + 1;
			}
			var $nextTpl = $('#tpl-'+nextId);

			$currentTpl.find('.griditem').each(function(){
				var left = 0 - (wwidth + Math.round(Math.random()* wwidth));
				$(this).velocity({
					translateX: left + "px"
				}, { duration: transitionDuration });
			})


			$nextTpl.find('.griditem').each(function(){
				var left = wwidth + Math.round(Math.random()* wwidth);
				$(this).velocity({
					translateX: left + "px",
					translateY:0
				}, { duration: 0 });

				$(this).velocity({
					translateX: "0px"
				}, { duration: transitionDuration });
			})

			$currentTpl = $nextTpl;

			pages.setPageStatus(currentId);

		},

		

		slideToPrev:function(){
			var currentId = $currentTpl.data('id'),
				prevId;
			if(currentId == 1){
				prevId = 36;
			} else { 
				prevId = currentId - 1;
			}
			var $nextTpl = $('#tpl-'+prevId);

			$currentTpl.find('.griditem').each(function(){
				var right = wwidth + Math.round(Math.random()* wwidth);
				$(this).velocity({
					translateX: right + "px"
				}, { duration: transitionDuration });
			})


			$nextTpl.find('.griditem').each(function(){
				var left = 0 - (wwidth + Math.round(Math.random()* wwidth));
				$(this).velocity({
					translateX: left + "px",
					translateY:0
				}, { duration: 0 });

				$(this).velocity({
					translateX: "0px"
				}, { duration: transitionDuration });
			})

			$currentTpl = $nextTpl;
			pages.setPageStatus(currentId);
		},

		slideToPage: function(id){
			// console.log('slideToPage: ' + id)

			pages.setPageStatus(id);

			$('.video').each(function(i){
				$(this).delay((i++) * 10).velocity("goUp", { 
					duration: transitionDuration
				})
			})

			var $tpl = $('#tpl-' + id);
			
			$tpl.find('.griditem').each(function(){
				var top = wheight + Math.round(Math.random()* wheight/2);
				$(this).velocity({
					translateX: 0,
					translateY: top + "px"
				}, { duration: 0 });

				$(this).velocity({
					translateY: "0px"
				}, { duration: transitionDuration });
				
			})
			$currentTpl = $tpl;
			

		},
		
		setPageStatus:function(currentId){
			var $tpl = $('#tpl-' + currentId);

			if(current_playlist[0] == currentId){
				$tpl.find('.img1').addClass('playing')
			} else{
				$tpl.find('.img1').removeClass('playing')
			}
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
				
			})
		},
		

		// ajout effectif d’une vidéo à la playlist
		addVideo: function(){

			var current_video_id = $currentTpl.data('id');

			

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
				$currentTpl.find('.add').addClass('nope');
				var s = setTimeout(function(){
					$add.removeClass('nope')
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
			for (var i = 0; i < current_playlist.length; i++) {
				var $whichitem = $('.video[data-id='+ current_playlist[i] +']');
				if(i==0){
					$whichitem.addClass('playing');
					$rankplaying = $whichitem.find('.rank');
					$whichitem.find('.rank').addClass('waitaminuteplease').text('…');
				} else{
					$whichitem.removeClass('playing');
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