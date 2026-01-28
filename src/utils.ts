/**
 * 工具函数
 */

import crypto from 'crypto';

/**
 * 生成签名
 * @param content 待签名内容
 * @param secret 密钥
 * @returns 签名字符串
 */
export function generateSign(content: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(content);
  return hmac.digest('hex');
}

/**
 * 延迟函数
 * @param ms 延迟毫秒数
 * @returns Promise
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 安全的 JSON 解析
 * @param text JSON 字符串
 * @returns 解析结果，失败返回 null
 */
export function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    return null;
  }
}

/**
 * 检查是否为有效的 URL
 * @param url URL 字符串
 * @returns 是否有效
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 格式化日期为 ISO 字符串
 * @param date 日期对象
 * @returns ISO 格式字符串
 */
export function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 * 创建简短 ID
 * @param prefix 前缀
 * @returns ID 字符串
 */
export function createShortId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

/**
 * 截断字符串
 * @param str 原字符串
 * @param maxLength 最大长度
 * @returns 截断后的字符串
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * 深度克隆对象
 * @param obj 待克隆对象
 * @returns 克隆后的对象
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
