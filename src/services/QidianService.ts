import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * 起点三江小说数据结构
 */
export interface NovelItem {
	title: string;
	author?: string;
	url?: string;
	category?: string;  // 分类（如"奇幻"、"仙侠"）
	tag?: string;       // 推荐标签（如"冰汽"、"爽文"）
}

/**
 * 周数据结构
 */
export interface WeekData {
	weekLabel: string;  // 例如：2025.10.26 - 2025.11.02
	novels: NovelItem[];
}

/**
 * 起点三江数据服务
 */
export class QidianService {
	private static readonly SANJIANG_URL = 'https://www.qidian.com/sanjiang/';

	/**
	 * 获取起点三江页面数据
	 */
	public static async fetchSanjiangData(): Promise<WeekData[]> {
		try {
			console.log(`[QidianService] 从网络获取数据: ${this.SANJIANG_URL}`);
			
			const response = await axios.get(this.SANJIANG_URL, {
				headers: {
					'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
					'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
					'Referer': 'https://www.qidian.com/',
					'Connection': 'keep-alive',
				},
				timeout: 10000,
			});

			console.log(`[QidianService] 网络请求状态码: ${response.status}`);
			return this.parseHtml(response.data);
		} catch (error) {
			console.error('[QidianService] 获取起点三江数据失败:', error);
			if (axios.isAxiosError(error)) {
				console.error(`[QidianService] 请求错误: ${error.message}`);
				if (error.response) {
					console.error(`[QidianService] 响应状态码: ${error.response.status}`);
				}
			}
			throw new Error(`获取数据失败: ${error instanceof Error ? error.message : '未知错误'}`);
		}
	}

	/**
	 * 解析HTML页面
	 */
	private static parseHtml(html: string): WeekData[] {
		const $ = cheerio.load(html);
		const weekDataList: WeekData[] = [];

		// 调试信息：检查HTML长度
		console.log(`[QidianService] HTML长度: ${html.length} 字符`);

		// 根据实际页面结构解析
		// 每周的数据在 <li class="strongrec-list book-list-wrap"> 中
		const weekElements = $('.strongrec-list.book-list-wrap');
		console.log(`[QidianService] 找到 ${weekElements.length} 个周数据`);

		weekElements.each((index, element) => {
			const $week = $(element);

			// 获取周标题（日期范围）
			const dateFrom = $week.find('.date-range-title .date-from').text().trim();
			const dateTo = $week.find('.date-range-title .date-to').text().trim();
			const weekLabel = `${dateFrom} - ${dateTo}`;

			console.log(`[QidianService] 第 ${index + 1} 周: ${weekLabel}`);

			// 获取该周的小说列表
			const novels: NovelItem[] = [];
			const bookElements = $week.find('.book-list ul li');
			console.log(`[QidianService] 第 ${index + 1} 周找到 ${bookElements.length} 本小说`);

			bookElements.each((idx, bookElement) => {
				const $book = $(bookElement);

				// 获取小说标题和链接
				const titleLink = $book.find('h2 a.name');
				const title = titleLink.text().trim();
				const url = titleLink.attr('href');

				// 获取分类
				const category = $book.find('a.channel').text().replace(/「|」/g, '').trim();

				// 获取推荐标签
				const tag = $book.find('span.rec').text().trim();

				if (title) {
					console.log(`[QidianService]   - ${title} [${category}] ${tag}`);
					novels.push({
						title,
						url: url ? (url.startsWith('http') ? url : `https:${url}`) : undefined,
						category: category || undefined,
						tag: tag || undefined,
					});
				}
			});

			if (weekLabel && novels.length > 0) {
				weekDataList.push({
					weekLabel,
					novels,
				});
			}
		});

		// 如果没有解析到数据，返回提示
		if (weekDataList.length === 0) {
			console.warn('[QidianService] 未能解析到数据，可能原因：');
			console.warn('  1. 网站返回的内容不完整');
			console.warn('  2. 页面结构已变化');
			console.warn('  3. 被反爬虫机制拦截');
			
			// 检查一些关键元素是否存在
			console.warn(`[QidianService] 调试信息:`);
			console.warn(`  - HTML是否包含"三江": ${html.includes('三江')}`);
			console.warn(`  - HTML是否包含"strongrec": ${html.includes('strongrec')}`);
			console.warn(`  - HTML是否包含"book-list": ${html.includes('book-list')}`);
			
			weekDataList.push({
				weekLabel: '暂无数据',
				novels: [
					{
						title: '未能从页面中获取到小说数据，请查看控制台日志',
						category: '提示',
					}
				],
			});
		} else {
			console.log(`[QidianService] 成功解析 ${weekDataList.length} 周的数据`);
		}

		return weekDataList;
	}
}
