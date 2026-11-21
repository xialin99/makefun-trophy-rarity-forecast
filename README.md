# Trophy Rarity Forecast

[中文](#中文) · [English](#english)

## 中文

根据历史达成率推算各奖杯未来的解锁概率，并给出多级置信分位。

### 本地运行

使用 Node.js 22.18 或更新版本。按赛事格式提供输入目录，通过 `MAKEFUN_INPUT_DIR` 和 `MAKEFUN_OUTPUT_DIR` 配置目录后运行 `node main.ts`。

PowerShell 示例

```powershell
$env:MAKEFUN_INPUT_DIR = "examples"
$env:MAKEFUN_OUTPUT_DIR = "out"
node main.ts
```

示例结果写入 `out/demo.out`。

## English

Forecasts future trophy unlock rates at several quantiles using time-stamped observations.

### Run locally

Use Node.js 22.18 or newer. Provide challenge-format input files through `MAKEFUN_INPUT_DIR`, set `MAKEFUN_OUTPUT_DIR`, and run `node main.ts`.

Try the included example on macOS or Linux with `MAKEFUN_INPUT_DIR=examples MAKEFUN_OUTPUT_DIR=out node main.ts`. The output is `out/demo.out`. For PowerShell, see the example above.

[make.fun 赛事 / Original bounty](https://make.fun/bounty/gta6-trophy-rarity-forecast-01)

## 许可证 / License

MIT. See [LICENSE](LICENSE).

