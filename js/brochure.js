/* ==========================================================================
   2026 ISF Mobile Brochure - brochure.js
   - ver_3의 Bootstrap Carousel/Modal 로직은 전혀 건드리지 않습니다.
   - 이 파일은 아래 두 가지만 담당합니다.
     1) slid.bs.carousel 이후 텍스트 reveal 애니메이션 재생/리셋
     2) scene10(달성구간) 내부 세로 스크롤과 좌우 Swipe의 제스처 충돌 방지
   ========================================================================== */
(function () {
	'use strict';

	var carouselEl = document.getElementById('carouselExampleIndicators');
	if (!carouselEl) return;

	/* ------------------------------------------------------------------
	   1. Reveal 애니메이션: Carousel이 좌우로 움직이는 도중에는 재생 금지
	   ------------------------------------------------------------------ */

	function playItem(item) {
		if (!item) return;
		// 재방문 시에도 다시 재생되도록, 우선 클래스를 제거했다가 다음 프레임에 다시 부여
		item.classList.remove('play');
		// 강제 리플로우로 애니메이션 재시작 보장
		void item.offsetWidth;
		item.classList.add('play');
	}

	function stopItem(item) {
		if (!item) return;
		item.classList.remove('play');
	}

	// slid.bs.carousel: 새 슬라이드가 화면 중앙에 "완전히" 도착한 시점
	carouselEl.addEventListener('slid.bs.carousel', function (e) {
		if (e.relatedTarget) {
			// 이전 활성 아이템들 정지
			var items = carouselEl.querySelectorAll('.carousel-item.play');
			items.forEach(function (el) {
				if (el !== e.relatedTarget) stopItem(el);
			});
			playItem(e.relatedTarget);
		}
	});

	// 최초 진입 시(첫 슬라이드는 이미 화면 중앙에 "도착"해 있는 상태) 바로 재생
	document.addEventListener('DOMContentLoaded', function () {
		var firstActive = carouselEl.querySelector('.carousel-item.active');
		// 모달(스와이프 안내)이 뜨는 것과 겹쳐 어수선하지 않도록 살짝 지연
		window.setTimeout(function () {
			playItem(firstActive);
		}, 250);
	});

	/* ------------------------------------------------------------------
	   2. scene10 내부 콘텐츠(2~4구간)만을 위한 IntersectionObserver
	      - 1~9 페이지는 절대 사용하지 않음 (Bootstrap 이벤트 기반 유지)
	   ------------------------------------------------------------------ */
	var rewardScroll = document.querySelector('.scene10 .reward-scroll');

	if (rewardScroll && 'IntersectionObserver' in window) {
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					entry.target.classList.add('in-view');
					io.unobserve(entry.target);
				}
			});
		}, {
			root: rewardScroll,
			threshold: 0.25
		});

		rewardScroll.querySelectorAll('.io-fade').forEach(function (el) {
			io.observe(el);
		});
	}

	/* ------------------------------------------------------------------
	   3. scene10 좌우 Swipe(Carousel) vs 상하 Scroll(reward-scroll) 충돌 방지
	      - 기존 Bootstrap 내장 스와이프 로직은 그대로 둔다.
	      - 세로 스크롤 의도가 뚜렷할 때만 이벤트 버블링을 막아
	        Carousel이 오작동으로 페이지를 넘기지 않도록 최소한으로 보정한다.
	      - 뚜렷한 좌우 Swipe는 그대로 버블링시켜 9페이지로 복귀 가능하게 유지.
	   ------------------------------------------------------------------ */
	if (rewardScroll) {
		var startX = 0;
		var startY = 0;
		var startScrollTop = 0;

		function onGestureStart(x, y) {
			startX = x;
			startY = y;
			startScrollTop = rewardScroll.scrollTop;
		}

		function onGestureEnd(e, x, y) {
			var dx = x - startX;
			var dy = y - startY;
			var scrolled = Math.abs(rewardScroll.scrollTop - startScrollTop) > 2;

			// 세로 의도(상하 이동량이 더 크거나, 실제로 스크롤이 발생한 경우)면
			// Carousel(prev/next 판단)까지 이벤트가 전달되지 않도록 막는다.
			if (scrolled || Math.abs(dy) > Math.abs(dx)) {
				e.stopPropagation();
			}
			// 그 외(뚜렷한 좌우 이동)는 그대로 버블링 -> 기존 Bootstrap Swipe 동작 유지
		}

		// Pointer Events(대부분의 모던 모바일 브라우저에서 Bootstrap 5가 사용하는 경로)
		rewardScroll.addEventListener('pointerdown', function (e) {
			onGestureStart(e.clientX, e.clientY);
		}, { passive: true });

		rewardScroll.addEventListener('pointerup', function (e) {
			onGestureEnd(e, e.clientX, e.clientY);
		});

		// Touch Events(PointerEvent 미지원 환경 대비 fallback)
		rewardScroll.addEventListener('touchstart', function (e) {
			var t = e.touches[0];
			onGestureStart(t.clientX, t.clientY);
		}, { passive: true });

		rewardScroll.addEventListener('touchend', function (e) {
			var t = e.changedTouches[0];
			onGestureEnd(e, t.clientX, t.clientY);
		});
	}
})();
