export class Tree<T> {
  root: TreeNode<T> | null;

  constructor() {
    this.root = null;
  }

  setRoot(node: TreeNode<T>): void {
    this.root = node;
  }
}

export class TreeNode<T> {
  value: T;
  children: TreeNode<T>[];

  constructor(value: T) {
    this.value = value;
    this.children = [];
  }

  addChild(node: TreeNode<T>): void {
    this.children.push(node);
  }
}
