from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:150]))
    pages = [
        "/", "/categories", "/lists", "/find", "/stack-audit", "/audits",
        "/learn", "/favorites", "/alternatives/1password",
        "/compare/bitwarden/vs/keepassxc", "/repo/toeverything/AFFiNE",
    ]
    for path in pages:
        pg.goto("http://127.0.0.1:3000" + path, timeout=60000)
        pg.wait_for_load_state("networkidle", timeout=60000)
        pg.wait_for_timeout(700)
        print(f"{path} -> h1:{pg.locator('h1').count()}")

    # click checks (light theme for determinism)
    pg.goto("http://127.0.0.1:3000", timeout=60000)
    pg.wait_for_load_state("networkidle", timeout=60000)
    pg.wait_for_timeout(800)
    pg.get_by_role("button", name="Password Manager").first.click()
    pg.wait_for_timeout(800)
    print("goal chip click works:", "?goal=" in pg.url)
    pg.goto("http://127.0.0.1:3000", timeout=60000)
    pg.wait_for_load_state("networkidle", timeout=60000)
    pg.wait_for_timeout(700)
    pg.get_by_role("button", name="Platform").first.click()
    pg.wait_for_timeout(400)
    print("platform dropdown works:", pg.locator("[role='listbox']").count() == 1)

    # dark mode true-black check
    pg.add_init_script("try{localStorage.setItem('osh-theme','dark')}catch(e){}")
    pg.goto("http://127.0.0.1:3000", timeout=60000)
    pg.wait_for_load_state("networkidle", timeout=60000)
    pg.wait_for_timeout(900)
    print("dark body:", pg.evaluate("() => getComputedStyle(document.body).backgroundColor"))

    print("page errors:", errs[:3] if errs else "NONE")
    b.close()
