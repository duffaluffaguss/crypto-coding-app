from playwright.sync_api import sync_playwright
import os

# Create screenshots directory
os.makedirs('screenshots', exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 800})

    # Set longer timeout for initial page loads (Next.js compilation)
    page.set_default_timeout(60000)

    print("Testing Zero to Crypto Dev App...")

    # Test 1: Landing page
    print("\n1. Testing landing page...")
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')
    page.screenshot(path='screenshots/01_landing.png', full_page=True)
    print(f"   Title: {page.title()}")

    # Check for key elements
    try:
        hero = page.locator('h1').first
        if hero.is_visible():
            print(f"   Hero: {hero.text_content()[:50]}...")
    except:
        pass

    # Test 2: Sign up page
    print("\n2. Testing signup page...")
    page.goto('http://localhost:3000/signup')
    page.wait_for_load_state('networkidle')
    page.screenshot(path='screenshots/02_signup.png', full_page=True)

    # Check for form elements
    email_input = page.locator('input[type="email"]')
    password_input = page.locator('input[type="password"]')
    print(f"   Email inputs: {email_input.count()}")
    print(f"   Password inputs: {password_input.count()}")

    # Test 3: Login page
    print("\n3. Testing login page...")
    page.goto('http://localhost:3000/login')
    page.wait_for_load_state('networkidle')
    page.screenshot(path='screenshots/03_login.png', full_page=True)
    print("   Login page loaded")

    # Test 4: Check onboarding interests page (will redirect if not logged in)
    print("\n4. Testing onboarding flow (unauthenticated)...")
    page.goto('http://localhost:3000/onboarding/interests')
    page.wait_for_load_state('networkidle')
    page.screenshot(path='screenshots/04_onboarding.png', full_page=True)
    current_url = page.url
    print(f"   Current URL: {current_url}")

    # If we're on interests page, check for interest buttons
    if 'interests' in current_url:
        interests = page.locator('button').all()
        print(f"   Found {len(interests)} buttons")

    # Test 5: Check share page with invalid ID
    print("\n5. Testing share page (should 404)...")
    page.goto('http://localhost:3000/share/invalid-id')
    page.wait_for_load_state('networkidle')
    page.screenshot(path='screenshots/05_share.png', full_page=True)
    print(f"   URL: {page.url}")

    browser.close()

    print("\n" + "="*50)
    print("Testing complete! Screenshots saved to ./screenshots/")
    print("="*50)
    print("\nOpen the screenshots folder to see the results.")
