from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(headless=True)
    pg=b.new_page(viewport={'width':1440,'height':900})
    for repo in ['nextcloud/server','usebruno/bruno','zulip/zulip']:
        pg.goto(f'http://127.0.0.1:3000/repo/{repo}', timeout=60000)
        pg.wait_for_load_state('networkidle', timeout=60000)
        pg.wait_for_timeout(2000)
        try:
            pg.locator("text=The honest review").first.scroll_into_view_if_needed(timeout=10000)
            pg.wait_for_timeout(500)
        except: pass
        slug=repo.split('/')[1]
        pg.screenshot(path=f'test/screenshots/editorial-{slug}.png', timeout=60000)
        ed=pg.get_by_text("The honest review").count()
        print(f'{repo} editorial: {ed} h1: {pg.locator("h1").inner_text()!r}')
    b.close()
print('done')
