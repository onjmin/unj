interface ListNode<T> {
	value: T | null;
	prev: ListNode<T> | null;
	next: ListNode<T> | null;
}
export class LinkedList<T> {
	#first: ListNode<T>;
	#cursor: ListNode<T>;
	constructor() {
		this.#first = { value: null, prev: null, next: null };
		this.#cursor = this.#first;
	}
	add(value: T) {
		const node: ListNode<T> = {
			value,
			prev: this.#cursor,
			next: null,
		};
		this.#cursor.next = node;
		this.#cursor = node;
	}
	undo(): T | null {
		const { prev } = this.#cursor;
		if (prev === null) return null;
		this.#cursor = prev;
		return this.#cursor.value;
	}
	redo(): T | null {
		const { next } = this.#cursor;
		if (next === null) return null;
		this.#cursor = next;
		return this.#cursor.value;
	}
}
