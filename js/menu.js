document.addEventListener("DOMContentLoaded", function () {
    const navContainer = document.getElementById("dynamic-navbar");
    if (navContainer) {
        // Mendapatkan path URL saat ini untuk mendeteksi menu aktif
        const currentPath = window.location.pathname;

        navContainer.innerHTML = `
            <div class="sf-sub-nav-inner">
                <a href="/" class="${currentPath === '/' ? 'active' : ''}">Repository</a>
                <a href="/firmware" class="${currentPath.includes('firmware') ? 'active' : ''}">Firmware Center</a>
                <a href="/schematic" class="${currentPath.includes('schematic') ? 'active' : ''}">Schematic Center</a>
                <a href="/tools" class="${currentPath.includes('tools') ? 'active' : ''}">PC Tools &amp; Drivers</a>
            </div>
        `;
    }
});