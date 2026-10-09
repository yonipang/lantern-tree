import asyncio
from playwright.async_api import async_playwright
SP=__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'out')+'/'; __import__('os').makedirs(SP, exist_ok=True)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(); pg.on('pageerror',lambda e: print('ERR',e.stack[:600]))
        await pg.goto('file://'+SP+'qa.html'); await pg.wait_for_timeout(800); await b.close()
asyncio.run(main())
