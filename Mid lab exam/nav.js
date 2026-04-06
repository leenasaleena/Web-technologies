// Hamburger menu toggle
const hamburgerBtn = document.getElementById('hamburger-btn');
const mainNav = document.getElementById('main-nav');

if (hamburgerBtn && mainNav) {
    hamburgerBtn.addEventListener('click', function () {
        mainNav.classList.toggle('nav-open');
        hamburgerBtn.classList.toggle('active');
    });

    // Close menu when a link is clicked
    mainNav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            mainNav.classList.remove('nav-open');
            hamburgerBtn.classList.remove('active');
        });
    });
}

// Initialize Slick Carousel for services
$(document).ready(function () {
    const $serviceGrid = $('.services-grid');
    const $counter = $('#slideCounter');
    const totalCards = $('.service-card').length; // Should be 5

    // Function to update slide counter
    function updateCounter() {
        const currentIndex = $serviceGrid.slick('slickCurrentSlide');
        const showing = (currentIndex % totalCards) + 1;
        $counter.text(`Showing ${showing} of ${totalCards}`);
    }

    // Initialize slick with required options
    $serviceGrid.slick({
        infinite: true,           // Infinite looping
        slidesToShow: 3,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 5000,      // 5 seconds
        pauseOnHover: true,       // Pause on hover over any card
        pauseOnFocus: false,
        arrows: false,            // Hide default arrows
        dots: false,
        responsive: [
            {
                breakpoint: 1024,  // iPad landscape
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1
                }
            },
            {
                breakpoint: 768,  // Tablet
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1
                }
            },
            {
                breakpoint: 480,  // Mobile
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    });

    // Bind custom previous/next buttons
    $('#prevServiceBtn').on('click', function () {
        $serviceGrid.slick('slickPrev');
    });

    $('#nextServiceBtn').on('click', function () {
        $serviceGrid.slick('slickNext');
    });

    // Update counter on init and after slide change
    $serviceGrid.on('init', function () {
        updateCounter();
    });
    $serviceGrid.on('afterChange', function () {
        updateCounter();
    });

    // Ensure counter is set after a short delay (safety)
    setTimeout(updateCounter, 100);
});