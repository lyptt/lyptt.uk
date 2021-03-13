const fs = require("fs");
const path = require("path");
const dayjs = require("dayjs");
const marked = require("marked");

function extractPostMetadata(name, content) {
  const startIdx = content.indexOf("<!--");
  if (startIdx === -1) {
    return content;
  }

  const endIdx = content.indexOf("-->", startIdx);
  if (endIdx === -1) {
    return content;
  }

  const metadata = JSON.parse(content.substr(startIdx + 4, endIdx - 4));
  metadata.permalink = name.replace(".md", "");
  metadata.date = dayjs(metadata.date);
  metadata.formattedDate = metadata.date.format("dddd MMM D YYYY hA");

  return metadata;
}

const contents = fs
  .readdirSync(path.join(__dirname, "..", "posts"))
  .filter((file) => file.endsWith(".md"))
  .map((file) => {
    const content = fs.readFileSync(
      path.join(__dirname, "..", "posts", file),
      "utf8"
    );
    const { permalink, date, title } = extractPostMetadata(file, content);

    return {
      title,
      date,
      url: permalink,
      content: marked(content),
    };
  })
  .sort((a, b) => new Date(b.date) - new Date(a.date));

const mod = `export default ${JSON.stringify(contents, null, 2)}`;

fs.writeFileSync(path.join(__dirname, "..", "src", "posts.js"), mod, "utf8");
