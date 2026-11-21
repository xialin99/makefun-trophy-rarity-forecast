# 奖杯解锁率预测 / Trophy Rarity Forecast

[中文](#中文) · [English](#english)

## 中文

### 第一次使用

安装 [Node.js 的 LTS 长期支持版](https://nodejs.org/en/download)（22.18 或更新）。

1. 在仓库页面点 **Code → Download ZIP**，下载并解压。打开解压后含有 `main.ts` 的文件夹。
2. 在 Windows 文件资源管理器地址栏输入 `powershell` 后按回车。把下面的命令复制到打开的窗口并回车。

```powershell
$env:MAKEFUN_INPUT_DIR = 'examples'
$env:MAKEFUN_OUTPUT_DIR = 'out'
node main.ts
```

打开 `out/demo.out` 查看两个示例奖杯的预计解锁率。输出数字是百分比，`q` 中依次列出各预测分位数。

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

输出 JSON 的 `trophies` 列出各奖杯，`id` 为编号，`q` 为预计解锁百分比的分位数。

## English

### First use

Install the [Node.js LTS release](https://nodejs.org/en/download), version 22.18 or newer.

1. Choose **Code → Download ZIP**, extract it, then open the extracted project folder.
2. On Windows, type `powershell` in the File Explorer address bar and press Enter. Run the commands below.

```powershell
$env:MAKEFUN_INPUT_DIR = 'examples'
$env:MAKEFUN_OUTPUT_DIR = 'out'
node main.ts
```

打开 `out/demo.out` 查看两个示例奖杯的预计解锁率。输出数字是百分比，`q` 中依次列出各预测分位数。 macOS or Linux users can use the shell example further down.

Forecasts future trophy unlock rates at several quantiles using time-stamped observations.

### Run locally

Use Node.js 22.18 or newer. Provide challenge-format input files through `MAKEFUN_INPUT_DIR`, set `MAKEFUN_OUTPUT_DIR`, and run `node main.ts`.

Try the included example on macOS or Linux with `MAKEFUN_INPUT_DIR=examples MAKEFUN_OUTPUT_DIR=out node main.ts`. The output is `out/demo.out`. For PowerShell, see the example above.

The output JSON lists `trophies` by `id`, with `q` holding the predicted unlock percentage quantiles.

[make.fun 赛事 / Original bounty](https://make.fun/bounty/gta6-trophy-rarity-forecast-01)

## 许可证 / License

MIT. See [LICENSE](LICENSE).

