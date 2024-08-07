// Smart Response Generator Extension for TypingMind
(() => {
  const MODEL_URL = 'https://api-inference.huggingface.co/models/mistralai/Mistral-Nemo-Instruct-2407/v1/chat/completions';


  
  // Function to get API key from local storage
  function getApiKey() {
    return localStorage.getItem('smartResponseGeneratorApiKey');
  }

  // Function to set API key in local storage
  function setApiKey(key) {
    localStorage.setItem('smartResponseGeneratorApiKey', key);
  }


  async function generateResponse(context) {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('API key not set. Please configure your Hugging Face API key in the settings.');
    }
  
    const messages = [
      { role: "system", content: "You are a helpful AI assistant designed to enhance conversations within a chat application. Your role is to analyze the provided chat history and generate 3 distinct response options that are contextually relevant and could steer the conversation in different directions. Aim for a friendly, helpful, and engaging tone in your suggested responses. Provide your responses in a numbered list format." },
      { role: "user", content: context }
    ];
  
    try {
      const response = await fetch(MODEL_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: messages,
          max_tokens: 500,
          temperature: 0.7,
          top_p: 0.95,
          n: 1  // We'll generate one response and split it into options
        })
      });
  
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const content = data.choices[0].message.content;
        // Split the content into separate options
        const options = content.split('\n').filter(line => line.trim().match(/^\d+\./));
        return options;
      } else {
        throw new Error('Unexpected response format from API');
      }
    } catch (error) {
      console.error('Error in generateResponse:', error);
      throw error;
    }
  }

  
  // Function to get chat context
  function getChatContext() {
    const chatMessages = document.querySelectorAll('[data-element-id^="user-message"], [data-element-id^="ai-response"]');
    const context = Array.from(chatMessages).slice(-10).map(msg => {
      const isUser = msg.getAttribute('data-element-id').startsWith('user-message');
      return (isUser ? 'User: ' : 'Assistant: ') + msg.textContent.trim();
    }).join("\n");
    
    console.log('Current chat context:', context); // Log the context for debugging
    return context || "Hello, I'm ready to assist you. What would you like to discuss?";
  }

  // Function to create and display suggestion buttons
  function displaySuggestions(suggestions) {
    const chatInput = document.querySelector('[data-element-id="chat-input-textbox"]');
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.id = 'smart-response-suggestions';
    suggestionsContainer.style.cssText = 'position: absolute; bottom: 100%; left: 0; width: 100%; background: #f0f0f0; border-top: 1px solid #ccc; padding: 10px; box-sizing: border-box;';
  
    suggestions.forEach((suggestion, index) => {
      const button = document.createElement('button');
      // Remove the numbering from the suggestion text
      const suggestionText = suggestion.replace(/^\d+\.\s*/, '');
      button.textContent = suggestionText.slice(0, 50) + '...';
      button.style.cssText = 'margin: 5px; padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;';
      button.onclick = () => {
        chatInput.value = suggestionText;
        suggestionsContainer.remove();
      };
      suggestionsContainer.appendChild(button);
    });
  
    chatInput.parentElement.style.position = 'relative';
    chatInput.parentElement.appendChild(suggestionsContainer);
  }

  // Function to create settings modal
  function createSettingsModal() {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;';
    
    const content = document.createElement('div');
    content.style.cssText = 'background: white; padding: 20px; border-radius: 5px; width: 300px;';
    
    const title = document.createElement('h2');
    title.textContent = 'Smart Response Generator Settings';
    
    const input = document.createElement('input');
    input.type = 'password';
    input.placeholder = 'Enter your Hugging Face API key';
    input.value = getApiKey() || '';
    input.style.cssText = 'width: 100%; padding: 5px; margin: 10px 0;';
    
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.style.cssText = 'padding: 5px 10px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer;';
    saveButton.onclick = () => {
      setApiKey(input.value);
      modal.remove();
    };
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.cssText = 'padding: 5px 10px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer; margin-left: 10px;';
    cancelButton.onclick = () => modal.remove();
    
    content.appendChild(title);
    content.appendChild(input);
    content.appendChild(saveButton);
    content.appendChild(cancelButton);
    modal.appendChild(content);
    
    return modal;
  }

  // Function to add the extension controls
  function addExtensionControls() {
    const chatInput = document.querySelector('[data-element-id="chat-input-textbox"]');
    if (!chatInput) {
      console.error('Chat input element not found. Retrying in 1 second...');
      setTimeout(addExtensionControls, 1000);
      return;
    }

    console.log('Chat input element found. Adding extension controls...');

    const controlsContainer = document.createElement('div');
    controlsContainer.style.cssText = 'position: absolute; right: 10px; top: -40px; display: flex; align-items: center;';

    // Toggle switch
    const toggleLabel = document.createElement('label');
    toggleLabel.style.cssText = 'display: flex; align-items: center; margin-right: 10px; cursor: pointer;';
    toggleLabel.innerHTML = `
      <input type="checkbox" id="smart-response-toggle" style="display: none;">
      <span style="width: 40px; height: 20px; background: #ccc; display: inline-block; border-radius: 10px; position: relative; transition: 0.3s;">
        <span style="width: 18px; height: 18px; background: white; position: absolute; top: 1px; left: 1px; border-radius: 50%; transition: 0.3s;"></span>
      </span>
    `;

    // Generate button
    const generateButton = document.createElement('button');
    generateButton.textContent = '💡 Generate';
    generateButton.style.cssText = 'padding: 5px 10px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer;';
    generateButton.onclick = async () => {
      if (isExtensionEnabled()) {
        if (!getApiKey()) {
          alert('Please set your Hugging Face API key in the settings first.');
          document.body.appendChild(createSettingsModal());
          return;
        }
        try {
          const context = getChatContext();
          const suggestions = await generateResponse(context);
          if (suggestions.length > 0) {
            displaySuggestions(suggestions);
          } else {
            throw new Error('No suggestions generated');
          }
        } catch (error) {
          console.error('Error details:', error);
          alert('Error generating response: ' + error.message);
        }
      }
    };

    // Settings button
    const settingsButton = document.createElement('button');
    settingsButton.textContent = '⚙️';
    settingsButton.style.cssText = 'padding: 5px 10px; background: #6c757d; color: white; border: none; border-radius: 3px; cursor: pointer; margin-left: 5px;';
    settingsButton.onclick = () => {
      document.body.appendChild(createSettingsModal());
    };

    // Add event listener to toggle
    const toggleInput = toggleLabel.querySelector('input');
    toggleInput.checked = isExtensionEnabled();
    toggleInput.addEventListener('change', (e) => {
      localStorage.setItem('smartResponseGeneratorEnabled', e.target.checked);
      updateToggleStyle(e.target);
    });

    controlsContainer.appendChild(toggleLabel);
    controlsContainer.appendChild(generateButton);
    controlsContainer.appendChild(settingsButton);
    chatInput.parentElement.style.position = 'relative';
    chatInput.parentElement.appendChild(controlsContainer);

    // Initial toggle style update
    updateToggleStyle(toggleInput);

    console.log('Extension controls added successfully.');
  }

  // Function to check if the extension is enabled
  function isExtensionEnabled() {
    return localStorage.getItem('smartResponseGeneratorEnabled') === 'true';
  }

  // Function to update toggle switch style
  function updateToggleStyle(toggleInput) {
    const toggleSpan = toggleInput.nextElementSibling;
    if (toggleInput.checked) {
      toggleSpan.style.background = '#28a745';
      toggleSpan.querySelector('span').style.left = '21px';
    } else {
      toggleSpan.style.background = '#ccc';
      toggleSpan.querySelector('span').style.left = '1px';
    }
  }

  // Initialize the extension
  function initExtension() {
    console.log('Initializing Smart Response Generator Extension...');
    addExtensionControls();
  }

  // Run the initialization when the page is fully loaded
  if (document.readyState === 'complete') {
    initExtension();
  } else {
    console.log('Document not ready. Waiting for load event...');
    window.addEventListener('load', initExtension);
  }
})();
