import { Config, OAuth, TradeContext } from "longbridge";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CLIENT_ID = "95787fee-4347-44e5-807c-720465da7bad";

async function main() {
  console.log("正在启动长桥 OAuth 授权流程...");
  console.log("浏览器会自动打开授权页面，请完成授权操作。\n");

  const oauth = await OAuth.build(CLIENT_ID, (_, url) => {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("请在浏览器中打开以下链接进行授权：");
    console.log(url);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  });

  const config = Config.fromOAuth(oauth);
  const ctx = TradeContext.new(config);

  console.log("授权成功！正在获取持仓数据验证...\n");

  try {
    const balances = await ctx.accountBalance();
    console.log("账户余额：");
    for (const b of balances) {
      console.log(`  币种: ${b.currency}, 可用现金: ${b.availableCash}, 总资产: ${b.totalCash}`);
    }
  } catch (e) {
    console.log("获取余额失败（可能账户未开通交易）:", e.message);
  }

  try {
    const positions = await ctx.stockPositions();
    const allPositions = positions.channels.flatMap((ch) => ch.positions || []);
    console.log(`\n持仓数量: ${allPositions.length}`);
    for (const p of allPositions) {
      console.log(`  ${p.symbol} (${p.symbolName}): ${p.quantity} 股, 成本价 ${p.costPrice}`);
    }
  } catch (e) {
    console.log("获取持仓失败:", e.message);
  }

  console.log("\n✅ OAuth 授权完成！Token 已自动保存，后续无需重复授权。");
  console.log("Token 存储在 ~/.longbridge/openapi/tokens/ 目录下。");
}

main().catch((e) => {
  console.error("授权失败:", e);
  process.exit(1);
});
