import os
from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        file_path = "file://" + os.path.abspath("site/games/playable/reply-all.html")
        page.goto(file_path)

        page.fill("#player-name-input", "Test Player")
        page.click("button:has-text('SIGN UP')")
        page.wait_for_selector("button:has-text('Clock In')")
        page.click("button:has-text('Clock In')")
        page.wait_for_selector("#inbox-list")
        page.locator("#inbox-list > div").first.click()

        page.evaluate("""
            const emp = EMPLOYEES.find(e => e.id === 'andrew_legal');
            const andrewOpponent = {
                id: 'andrew_test', name: 'Andrew', employeeId: 'andrew_legal',
                hp: 1, maxHp: 100, wins: 1, buffs: [], addressBook: [],
                threadBonuses: {}, _lineBags: {}, attacks: ['Hello'],
                deflectLines: ['Hold on'], selfPromoteLines: ['I win'],
                isDefeated: false
            };
            if (emp) { andrewOpponent.attacks = emp.lines.map(l => l.text); andrewOpponent.defeatMessage = emp.defeatMessage; }
            applyUnitDefaults(andrewOpponent);
            const other = { id: 'other', name: 'Other', employeeId: 'other', hp: 100, maxHp: 100, wins: 1, buffs: [], addressBook: [], threadBonuses: {}, _lineBags: {}, attacks: ['Hi'], deflectLines: ['No'], selfPromoteLines: ['Win'], isDefeated: false };
            applyUnitDefaults(other);
            opponents = [andrewOpponent, other];
            state.targetId = 'andrew_test';
            state.player.addressBook = ['cc_andrew_legal'];
            updateUI();
        """)

        # Defeat Andrew
        page.click("button:has-text('Reply to')")
        page.wait_for_selector("text=Unsubscribing", timeout=10000)
        page.wait_for_timeout(2000)

        # Open address book and click Andrew
        page.click("button:has-text('Loop Personnel')")
        page.locator(".address-book-item", has_text="Andrew").click()

        page.screenshot(path="verification/andrew_after_defeat.png")
        browser.close()

if __name__ == "__main__":
    verify()
