function updateClock() {
  const now = new Date();
  $("#clock").text(now.toLocaleTimeString('en-US', { hour12: false }));
}
setInterval(updateClock, 1000);
updateClock();

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

$(".fade-up").each(function (index, el) { 
   observer.observe(el);
});

$(".skills-grid, .projects-grid, .about-stats").each(function(index, grid) {
        $(grid).find('.fade-up').each((i, el) => {
        el.style.transitionDelay = `${i * 80}ms`;
    });
});

$(".skill-group:first").click(function() { 
  window.open = "https://www.udemy.com/course/the-complete-web-development-bootcamp/learn/lecture/12384214#overview";
});

$(".sec-group").click(function(){
  window.open = "https://www.udemy.com/course/learn-python-and-ethical-hacking-from-scratch/?couponCode=KEEPLEARNING"
})