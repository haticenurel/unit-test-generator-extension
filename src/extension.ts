import * as vscode from 'vscode';
import { generateUnitTestFromCode } from './generateUnitTestFromCode';
import { generateIntegrationTests } from './generateIntegrationTestFromCode';
import AppDatabase from './AppDatabase';
import { fileFromPath } from 'openai';

async function getUserInfo(): Promise<{ name: string | undefined; email: string | undefined; oa_api_key: string | undefined; }> {
  
    const nameInput = await vscode.window.showInputBox({
      prompt: 'Enter your name:', 
    });

    const emailInput = await vscode.window.showInputBox({
      prompt: 'Enter your email:', 
    });

    const oaApiKeyInput = await vscode.window.showInputBox({
      prompt: 'Enter your OpenAI API key:', 
    });
    
    if (nameInput && emailInput && oaApiKeyInput) {
      vscode.window.showInformationMessage(`Welcome, ${nameInput}!`);

      const db = new AppDatabase();
      await db.insertDeveloper(nameInput , emailInput);
      await db.insertConfigurationsTable(oaApiKeyInput);
    }

    return { name: nameInput, email: emailInput, oa_api_key: oaApiKeyInput };

  
}

function greetUser(name: string | undefined) {
  if (!name) {
    return;
  }

  vscode.window.showInformationMessage(`Welcome, ${name}!`);
}

// This method is called when your extension is activated
export async function activate(context: vscode.ExtensionContext) {

  const name = await getUserInfo();
  greetUser(name.name);

  console.log('Extension "unit-test-generator-for-cpp" is now active!');

  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return vscode.window.showErrorMessage('No active editor.');
  }

  const selection = editor.selection;
  const selectedText = editor.document.getText(selection);
  if (!selectedText) {
    return vscode.window.showErrorMessage('Select code to create a unit test for.');
  }

  let disposable = vscode.commands.registerCommand('unit-test-generator-for-cpp.createUnitTest', async () => {
    let editorDocumentFileName = editor.document.fileName;
    const res = await generateUnitTestFromCode(selectedText, editorDocumentFileName);
    if (!res.success) {
      return vscode.window.showErrorMessage('Failed to generate unit test.');
    } else {
      vscode.window.showInformationMessage('Unit test generated file at: ' + res.fileName);
      if (!res.filePath) {
        return;
      }
      vscode.workspace.openTextDocument(res.filePath).then(doc => {
        vscode.window.showTextDocument(doc);
      });
    }
  });

  context.subscriptions.push(disposable);



  let disposableIntegrationTest = vscode.commands.registerCommand('unit-test-generator-for-cpp.createIntegrationTest', async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return vscode.window.showErrorMessage('No workspace folder open');
    }
  
    const workspaceFolder = workspaceFolders[0];
    const workspacePath = workspaceFolder.uri.fsPath;
  
    const result = await generateIntegrationTests(workspacePath);
    if (!result.success) {
      return vscode.window.showErrorMessage('Failed to generate integration tests.');
    } else {
      vscode.window.showInformationMessage('Integration tests generated at: ' + result.filePath);
      if (!result.filePath) {
        return;
      }
      vscode.workspace.openTextDocument(result.filePath).then(doc => {
        vscode.window.showTextDocument(doc);
      });
    }
  });
  
  context.subscriptions.push(disposableIntegrationTest);
}

exports.activate = activate;

export function deactivate() {
  console.log('Extension "unit-test-generator-for-cpp" is now deactivated!');
}