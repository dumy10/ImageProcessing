/**
 * Generic Tree class representing a tree data structure.
 * @template T - The type of the value stored in the tree nodes.
 */
export class Tree<T> {
  /**
   * The root node of the tree.
   * @type {TreeNode<T> | null}
   */
  root: TreeNode<T> | null = null;

  /**
   * Sets the root node of the tree.
   * @param {TreeNode<T>} node - The node to set as the root.
   */
  setRoot(node: TreeNode<T>): void {
    this.root = node;
  }
}

/**
 * Generic TreeNode class representing a node in a tree data structure.
 * @template T - The type of the value stored in the tree node.
 */
export class TreeNode<T> {
  /**
   * The value stored in the node.
   * @type {T}
   */
  value: T;

  /**
   * The children of the node.
   * @type {TreeNode<T>[]}
   */
  children: TreeNode<T>[] = [];

  /**
   * The parent of the node.
   * @type {TreeNode<T> | null}
   */
  parent: TreeNode<T> | null = null;

  /**
   * Creates a new tree node.
   * @param {T} value - The value to store in the node.
   */
  constructor(value: T) {
    this.value = value;
  }

  /**
   * Adds a child node to this node.
   * @param {TreeNode<T>} child - The child node to add.
   */
  addChild(child: TreeNode<T>): void {
    this.children.push(child);
    child.parent = this;
  }
}
