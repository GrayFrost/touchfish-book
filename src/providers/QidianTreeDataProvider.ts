import * as vscode from 'vscode';
import { QidianService, WeekData, NovelItem } from '../services/QidianService';

/**
 * Tree Item 类型
 */
type TreeItemType = 'week' | 'novel';

/**
 * 树节点数据
 */
class QidianTreeItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly type: TreeItemType,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly novel?: NovelItem,
		public readonly children?: QidianTreeItem[]
	) {
		super(label, collapsibleState);

		if (type === 'week') {
			this.iconPath = new vscode.ThemeIcon('calendar');
			this.contextValue = 'week';
		} else {
			this.iconPath = new vscode.ThemeIcon('book');
			this.contextValue = 'novel';
			
			// 设置描述（分类和标签）
			const descParts: string[] = [];
			if (novel?.category) {
				descParts.push(`「${novel.category}」`);
			}
			if (novel?.tag) {
				descParts.push(novel.tag);
			}
			if (descParts.length > 0) {
				this.description = descParts.join(' ');
			}

			// 设置点击命令
			if (novel?.url) {
				this.command = {
					command: 'touchfish-book.openNovel',
					title: '打开小说',
					arguments: [novel.url, novel.title]
				};
			}

			// 设置悬停提示
			this.tooltip = new vscode.MarkdownString();
			this.tooltip.appendMarkdown(`**${novel?.title}**\n\n`);
			if (novel?.category) {
				this.tooltip.appendMarkdown(`分类: ${novel.category}\n\n`);
			}
			if (novel?.tag) {
				this.tooltip.appendMarkdown(`标签: ${novel.tag}\n\n`);
			}
			if (novel?.url) {
				this.tooltip.appendMarkdown(`[在浏览器中打开](${novel.url})`);
			}
		}
	}
}

/**
 * 起点三江 TreeDataProvider
 */
export class QidianTreeDataProvider implements vscode.TreeDataProvider<QidianTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<QidianTreeItem | undefined | null | void> = new vscode.EventEmitter<QidianTreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<QidianTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

	private weekDataList: WeekData[] = [];
	private treeItems: QidianTreeItem[] = [];
	private isLoading: boolean = false;

	constructor() {
		// 初始化时加载数据
		this.refresh();
	}

	/**
	 * 刷新数据
	 */
	public async refresh(): Promise<void> {
		if (this.isLoading) {
			return;
		}

		this.isLoading = true;
		try {
			vscode.window.setStatusBarMessage('正在加载起点三江数据...', 2000);
			this.weekDataList = await QidianService.fetchSanjiangData();
			this.buildTreeItems();
			this._onDidChangeTreeData.fire();
			vscode.window.setStatusBarMessage('起点三江数据加载完成', 2000);
		} catch (error) {
			const message = error instanceof Error ? error.message : '未知错误';
			vscode.window.showErrorMessage(`加载失败: ${message}`);
			
			// 显示错误提示
			this.treeItems = [
				new QidianTreeItem(
					'加载失败',
					'week',
					vscode.TreeItemCollapsibleState.None
				)
			];
			this._onDidChangeTreeData.fire();
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * 构建树结构
	 */
	private buildTreeItems(): void {
		this.treeItems = this.weekDataList.map(weekData => {
			const novelItems = weekData.novels.map(novel => 
				new QidianTreeItem(
					novel.title,
					'novel',
					vscode.TreeItemCollapsibleState.None,
					novel
				)
			);

			return new QidianTreeItem(
				`${weekData.weekLabel} (${weekData.novels.length})`,
				'week',
				vscode.TreeItemCollapsibleState.Expanded,
				undefined,
				novelItems
			);
		});
	}

	/**
	 * 获取树节点
	 */
	getTreeItem(element: QidianTreeItem): vscode.TreeItem {
		return element;
	}

	/**
	 * 获取子节点
	 */
	getChildren(element?: QidianTreeItem): Thenable<QidianTreeItem[]> {
		if (!element) {
			// 返回根节点（周列表）
			return Promise.resolve(this.treeItems);
		} else {
			// 返回子节点（小说列表）
			return Promise.resolve(element.children || []);
		}
	}
}

