import os
from playwright.sync_api import sync_playwright, expect

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        file_path = "file://" + os.path.abspath("site/games/playable/reply-all.html")
        page.goto(file_path)

        # Start game
        page.fill("#player-name-input", "Test Player")
        page.click("button:has-text('SIGN UP')")
        page.wait_for_selector("button:has-text('Clock In')")
        page.click("button:has-text('Clock In')")

        # Now in inbox screen
        page.wait_for_selector("#inbox-list")
        page.locator("#inbox-list > div").first.click()

        page.wait_for_selector("button:has-text('Loop Personnel')")

        # Inject JS to setup state
        page.evaluate("""
            const emp = EMPLOYEES.find(e => e.id === 'andrew_legal');
            const andrewOpponent = {
                id: 'andrew_test',
                name: 'Andrew',
                employeeId: 'andrew_legal',
                departmentId: 'legal',
                hp: 1,
                maxHp: 100,
                wins: 1,
                buffs: [{ id: 'cc_telly_operations', name: 'Telly', usedBy: 'Andrew', eff: { singleDmg: 5 } }],
                addressBook: [],
                threadBonuses: {},
                _lineBags: {},
                attacks: ['Hello'],
                deflectLines: ['Hold on'],
                selfPromoteLines: ['I win'],
                signatures: [],
                greet: 'Hi',
                signoff: 'Bye',
                isDefeated: false
            };
            if (emp) {
                andrewOpponent.attacks = emp.lines.map(l => l.text);
                andrewOpponent.defeatMessage = emp.defeatMessage;
            }
            applyUnitDefaults(andrewOpponent);

            const otherOpponent = {
                id: 'other',
                name: 'Other',
                employeeId: 'other',
                hp: 100,
                maxHp: 100,
                wins: 1,
                buffs: [],
                addressBook: [],
                threadBonuses: {},
                _lineBags: {},
                attacks: ['Hi'],
                deflectLines: ['No'],
                selfPromoteLines: ['Win'],
                signatures: [],
                greet: 'Hi',
                signoff: 'Bye',
                isDefeated: false
            };
            applyUnitDefaults(otherOpponent);

            opponents = [andrewOpponent, otherOpponent];
            state.targetId = 'andrew_test';
            state.isProcessing = false;
            state.player.addressBook = ['cc_andrew_legal', 'cc_telly_operations'];
            updateUI();
        """)

        # Open address book
        page.click("button:has-text('Loop Personnel')")
        page.wait_for_selector("#contact-list")

        # Check Andrew implicated
        page.locator(".address-book-item", has_text="Andrew").click()
        page.wait_for_selector("#contact-detail:has-text('IMPLICATED')")

        # Check Telly in loop
        page.locator(".address-book-item", has_text="Telly").click()
        page.wait_for_selector("#contact-detail:has-text('IN LOOP (Andrew)')")

        page.screenshot(path="verification/before_defeat.png")
        page.click("#address-book button:has-text('CANCEL')")

        # Defeat Andrew
        page.click("button:has-text('Reply to')")

        # Wait a bit
        page.wait_for_timeout(3000)

        # Open address book again
        page.click("button:has-text('Loop Personnel')")

        # Check Andrew no longer implicated
        page.locator(".address-book-item", has_text="Andrew").click()
        page.wait_for_selector("#contact-detail button:has-text('LOOP IN')")

        # Check Telly no longer in loop
        page.locator(".address-book-item", has_text="Telly").click()
        page.wait_for_selector("#contact-detail button:has-text('LOOP IN')")

        page.screenshot(path="verification/after_defeat.png")

        browser.close()

if __name__ == "__main__":
    verify()
