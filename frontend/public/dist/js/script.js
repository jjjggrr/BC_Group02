!function() {
  const e = document.documentElement;
  // Switch from 'no-js' to 'js' on the main <html> tag
  e.classList.remove("no-js");
  e.classList.add("js");

  // Check if the body has the 'has-animations' class
  if (document.body.classList.contains("has-animations")) {
    // Add the 'anime-ready' class. This is the only step needed
    // to trigger the CSS to make your '.anime-element' (the SVG) visible.
    e.classList.add("anime-ready");
  }
}();


document.addEventListener('DOMContentLoaded', function() {
    // SIDEBAR MENU TOGGLE
    const allSideMenu = document.querySelectorAll('#sidebar .side-menu.top li a');
    allSideMenu.forEach(item=> {
        const li = item.parentElement;
        item.addEventListener('click', function () {
            allSideMenu.forEach(i=> {
                i.parentElement.classList.remove('active');
            })
            li.classList.add('active');
        })
    });

    // TOGGLE SIDEBAR VISIBILITY
    const menuBar = document.querySelector('#content nav .bx.bx-menu');
    const sidebar = document.getElementById('sidebar');

    if(menuBar && sidebar) {
        menuBar.addEventListener('click', function () {
            sidebar.classList.toggle('hide');
        });
    }

    // SEARCH FORM TOGGLE
    const searchButton = document.querySelector('#content nav form .form-input button');
    const searchButtonIcon = document.querySelector('#content nav form .form-input button .bx');
    const searchForm = document.querySelector('#content nav form');

    if (searchButton && searchForm) {
        searchButton.addEventListener('click', function (e) {
            if(window.innerWidth < 576) {
                e.preventDefault();
                searchForm.classList.toggle('show');
                if(searchForm.classList.contains('show')) {
                    searchButtonIcon.classList.replace('bx-search', 'bx-x');
                } else {
                    searchButtonIcon.classList.replace('bx-x', 'bx-search');
                }
            }
        });
    }

    // INITIAL AND RESIZE RESPONSIVE BEHAVIOR
    function handleResponsiveLayout() {
        if(sidebar && window.innerWidth < 768) {
            sidebar.classList.add('hide');
        }

        if(searchForm && window.innerWidth > 576) {
            if (searchButtonIcon) {
                searchButtonIcon.classList.replace('bx-x', 'bx-search');
            }
            searchForm.classList.remove('show');
        }
    }

    handleResponsiveLayout(); // Run on initial load
    window.addEventListener('resize', handleResponsiveLayout); // Run on resize

    // DARK/LIGHT MODE SWITCH
    const switchMode = document.getElementById('switch-mode');
    if(switchMode) {
        switchMode.addEventListener('change', function () {
            if(this.checked) {
                document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark');
            }
        });
    }
});