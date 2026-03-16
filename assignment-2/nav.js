const hamburgerBtn = document.getElementById('hamburger-btn');
const mainNav = document.getElementById('main-nav');

hamburgerBtn.addEventListener('click', function () {
    mainNav.classList.toggle('nav-open');
    hamburgerBtn.classList.toggle('active');
});

mainNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
        mainNav.classList.remove('nav-open');
        hamburgerBtn.classList.remove('active');
    });
});
