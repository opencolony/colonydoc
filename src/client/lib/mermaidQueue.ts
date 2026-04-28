import mermaid from 'mermaid'

const isDarkMode = () => document.documentElement.classList.contains('dark')

interface RenderResult {
  svg: string
  error: string
}

interface QueueItem {
  id: string
  source: string
  theme: string
  callback: (result: RenderResult) => void
}

class MermaidRenderQueue {
  private static instance: MermaidRenderQueue | null = null

  private queue: QueueItem[] = []
  private running = new Set<string>()
  private cache = new Map<string, RenderResult>()

  private readonly MAX_CONCURRENT = 2
  private readonly MAX_CACHE_SIZE = 50

  static getInstance(): MermaidRenderQueue {
    if (!MermaidRenderQueue.instance) {
      MermaidRenderQueue.instance = new MermaidRenderQueue()
    }
    return MermaidRenderQueue.instance
  }

  /**
   * 请求渲染一个 mermaid 图表
   * @param id 唯一标识，用于取消
   * @param source mermaid 源码
   * @param theme 主题
   * @param callback 渲染完成回调
   */
  request(id: string, source: string, theme: string, callback: (result: RenderResult) => void): void {
    // 先检查缓存
    const cacheKey = this.getCacheKey(source, theme)
    const cached = this.cache.get(cacheKey)
    if (cached) {
      callback(cached)
      return
    }

    // 取消同 id 的已有请求
    this.cancel(id)

    // 加入队列
    this.queue.push({ id, source, theme, callback })
    this.processQueue()
  }

  /**
   * 取消指定 id 的渲染请求
   */
  cancel(id: string): void {
    // 从待处理队列中移除
    const idx = this.queue.findIndex(item => item.id === id)
    if (idx !== -1) {
      this.queue.splice(idx, 1)
    }
    // 如果正在运行，标记为不再关心结果（通过移除 running 中的 id 实现）
    this.running.delete(id)
  }

  private getCacheKey(source: string, theme: string): string {
    return `${theme}::${source}`
  }

  private getFromCache(source: string, theme: string): RenderResult | null {
    const key = this.getCacheKey(source, theme)
    const cached = this.cache.get(key)
    if (cached) {
      // 更新访问顺序（LRU：移到末尾表示最近使用）
      this.cache.delete(key)
      this.cache.set(key, cached)
      return cached
    }
    return null
  }

  private setCache(source: string, theme: string, result: RenderResult): void {
    const key = this.getCacheKey(source, theme)
    // 如果已存在，先删除再添加以更新访问顺序
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }
    // 超出容量时淘汰最旧的
    while (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }
    this.cache.set(key, result)
  }

  private processQueue(): void {
    if (this.running.size >= this.MAX_CONCURRENT) return
    if (this.queue.length === 0) return

    const item = this.queue.shift()
    if (!item) return

    this.running.add(item.id)
    this.runRender(item)
  }

  private async runRender(item: QueueItem): Promise<void> {
    // 再次检查缓存（可能在排队期间已被其他请求渲染并缓存）
    const cached = this.getFromCache(item.source, item.theme)
    if (cached) {
      if (this.running.has(item.id)) {
        this.running.delete(item.id)
        item.callback(cached)
      }
      this.processQueue()
      return
    }

    try {
      // 设置主题
      mermaid.initialize({
        startOnLoad: false,
        theme: item.theme as 'dark' | 'default',
        suppressErrorRendering: true,
      })

      const mermaidId = `mermaid-queued-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const { svg } = await mermaid.render(mermaidId, item.source)

      const result: RenderResult = { svg, error: '' }
      this.setCache(item.source, item.theme, result)

      if (this.running.has(item.id)) {
        this.running.delete(item.id)
        item.callback(result)
      }
    } catch (err: any) {
      const result: RenderResult = { svg: '', error: err.message || 'Mermaid render error' }
      this.setCache(item.source, item.theme, result)

      if (this.running.has(item.id)) {
        this.running.delete(item.id)
        item.callback(result)
      }
    } finally {
      this.processQueue()
    }
  }
}

export const mermaidQueue = MermaidRenderQueue.getInstance()
