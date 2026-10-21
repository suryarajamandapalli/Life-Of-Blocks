const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:/Users/SURYARAJA/.gemini/antigravity/brain/9a8f18df-d84f-4a23-9415-f82b28b5979a/.system_generated/logs/transcript_full.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('"step_index":581')) {
      const obj = JSON.parse(line);
      fs.writeFileSync('user_reference.html', obj.content, 'utf8');
      console.log('Successfully saved user_reference.html, length:', obj.content.length);
      break;
    }
  }
}

processLineByLine();
